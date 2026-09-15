import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

function MessageUser() {
  const navigate = useNavigate()
  const { user } = useParams()
  const userId = user || 'default'
  const basePath = userId && userId !== 'default' ? `/${userId}` : ""
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const inputRefs = useRef([])

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
      const phoneNumber = ''
      const storedApp = localStorage.getItem('loanAppData')
      if (storedApp) {
        try {
          const appData = JSON.parse(storedApp)
          const phone = appData.number || ''
        } catch {}
      }

      const formattedMessage = message.trim()

      localStorage.setItem('adminMessage', formattedMessage)
      localStorage.setItem('adminMessageTimestamp', Date.now().toString())
      
      setLoading(false)
      alert("Message sent to website successfully")
      navigate(`${basePath}/dashboard`)
    } catch (err) {
      setError("Failed to send message: " + err.message)
      setLoading(false)
    }
  }

  return (
    <div className="message-user-container" style={{
      maxWidth: "500px",
      margin: "0 auto",
      padding: "20px",
      fontFamily: "Arial, sans-serif"
    }}>
      <div className="message-header" style={{ textAlign: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "10px" }}>
          <span style={{ fontSize: "24px" }}>💬</span>
          <h2 style={{ margin: 0 }}>Message User</h2>
        </div>
        <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
          Enter a message to send to the waiting client
        </p>
      </div>

      <div className="message-input-area">
        <textarea
          ref={el => inputRefs.current[0] = el}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here... (Can be in any language)"
          className="message-textarea"
          rows={6}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "14px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            resize: "vertical",
            fontFamily: "Arial, sans-serif",
            boxSizing: "border-box"
          }}
        />
      </div>

      {error && <div className="error-message" style={{ color: "red", padding: "10px", backgroundColor: "#ffeeee", borderRadius: "5px", margin: "10px 0" }}>{error}</div>}

      <div className="message-actions" style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button 
          onClick={sendConfirmation} 
          className="send-btn"
          disabled={loading || !message.trim()}
          style={{
            flex: 1,
            padding: "12px 20px",
            backgroundColor: loading ? "#ccc" : "#11bb4a",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "bold"
          }}
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
        <button 
          onClick={() => navigate(`${basePath}/dashboard`)}
          className="cancel-btn"
          style={{
            flex: 1,
            padding: "12px 20px",
            backgroundColor: "#f5f5f5",
            color: "#333",
            border: "1px solid #ddd",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default MessageUser