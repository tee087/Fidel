import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

function LoanSuccess() {
  const navigate = useNavigate()
  const { user } = useParams()
  const [name, setName] = useState("Client")
  const [amount, setAmount] = useState("N/A")
  const [phone, setPhone] = useState("")

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlName = urlParams.get('name')
    const urlAmount = urlParams.get('amount')
    
    if (urlName) setName(decodeURIComponent(urlName))
    if (urlAmount) setAmount(decodeURIComponent(urlAmount))
    
    const clientData = localStorage.getItem('clientData')
    if (clientData) {
      try {
        const client = JSON.parse(clientData)
        if (client.name) setName(client.name)
        if (client.loan) setAmount(client.loan)
        if (client.number) setPhone(client.number)
      } catch {}
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
        background: 'linear-gradient(135deg, #11bb4a 0%, #0d9a45 100%)',
        padding: '50px',
        borderRadius: '20px',
        textAlign: 'center',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
        color: 'white'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          marginBottom: '30px'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="white">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>
        
        <h1 style={{
          fontSize: '28px',
          margin: '0 0 20px',
          fontWeight: 'bold'
        }}>
          Félicitations! 🎉
        </h1>
        
        <p style={{
          margin: '0 0 15px',
          fontSize: '16px',
          opacity: 0.9
        }}>
          Félicitations {name}! Votre demande a été approuvée.
        </p>
        
        <p style={{
          margin: '0 0 25px',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Montant: <span style={{ color: '#FFD700' }}>${amount} USD</span>
        </p>
        
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '30px'
        }}>
          <p style={{
            margin: '5px 0',
            fontSize: '14px',
            opacity: 0.9
          }}>
            ✅ Le montant de <strong>${amount} USD</strong> sera ajouté à votre compte Airtel Money
          </p>
          <p style={{
            margin: '5px 0',
            fontSize: '14px',
            opacity: 0.9
          }}>
            📱 Vérifiez votre numéro +243 {phone || "XXXXXXXXX"} pour confirmer le dépôt
          </p>
          <p style={{
            margin: '5px 0 0 0',
            fontSize: '12px',
            opacity: 0.8
          }}>
            ℹ️ Les fonds seront crédités dans les 24 heures ouvrables
          </p>
        </div>
        
        <button
          onClick={() => navigate(`/${user || 'default'}/`)}
          style={{
            padding: '15px 40px',
            backgroundColor: 'white',
            color: '#11bb4a',
            border: 'none',
            borderRadius: '30px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}
        >
          Terminé
        </button>
      </div>
    </div>
  )
}

export default LoanSuccess