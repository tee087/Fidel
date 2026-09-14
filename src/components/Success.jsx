import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

function Success() {
  const navigate = useNavigate()
  const { user } = useParams()
  const userId = user || 'default'
  const [name, setName] = useState("Client")
  const [showPopup, setShowPopup] = useState(true)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlName = urlParams.get('name')
    if (urlName) {
      setName(decodeURIComponent(urlName))
    }

    const timer = setTimeout(() => {
      setShowPopup(false)
      setTimeout(() => {
        navigate(`/${userId}/login`)
      }, 300)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  if (!showPopup) {
    return null
  }

  return (
    <div className="_successcont_gxo1w_1" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '15px',
        textAlign: 'center',
        maxWidth: '400px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src="/assets/image.png" alt="Logo" style={{ height: '55px', width: 'auto', maxWidth: '120px' }} />
        </div>
        <h1 style={{ fontSize: '24px', margin: '0 0 15px' }}>
          Succès ! Félicitations. 🎉 
        </h1>
        <p style={{ margin: '0 0 10px', color: '#666' }}>
          Vos informations ont été transmises avec succès.
        </p>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          Redirection vers la page de connexion...
        </p>
      </div>
    </div>
  )
}

export default Success