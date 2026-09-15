import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

function MessageUser() {
  const navigate = useNavigate()
  const { user } = useParams()
  const userId = user || 'default'
  const basePath = userId && userId !== 'default' ? `/${userId}` : ""

  useEffect(() => {
    const adminMsg = sessionStorage.getItem('adminMessage')
    if (adminMsg) {
      alert("Message from Admin:\n\n" + adminMsg)
      sessionStorage.removeItem('adminMessage')
    }
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#f0f8ff',
        border: '2px solid #11bb4a',
        borderRadius: '12px',
        padding: '30px',
        textAlign: 'center',
        maxWidth: '450px',
        width: '100%'
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "15px" }}>
          <span style={{ color: "#11bb4a", fontSize: "32px" }}>💬</span>
          <h2 style={{ margin: 0, color: "#065f46" }}>Message from Admin</h2>
        </div>
        <p style={{ color: "#333", fontSize: "16px", lineHeight: "1.6", marginBottom: "20px" }}>
          Messages from the admin are delivered via the Telegram bot.
          <br /><br />
          When an admin sends a message through the bot, it will appear here as a popup.
        </p>
        <button
          onClick={() => navigate(`${basePath}/dashboard`)}
          style={{
            padding: '12px 30px',
            backgroundColor: '#11bb4a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  )
}

export default MessageUser