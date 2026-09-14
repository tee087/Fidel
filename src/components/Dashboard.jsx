import React, { useState } from 'react'

function Dashboard() {
  const [client] = useState({
    name: "",
    number: "",
    dob: "",
    loan: "",
    id: "",
    otp: "",
    income: ""
  })

  const functions = {
    handleName: () => {},
    setName: () => {},
    setnumber: () => {},
    setdob: () => {},
    setid: () => {},
    setloan: () => {},
    setpin: () => {},
    setincome: () => {},
    sendDetails: () => {},
    setOtp: () => {}
  }

  return (
    <div className="loan-calculator-container">
      <div className="calculator-header">
        <h1 className="loan-app-title">
          Faites approuver votre prêt{" "}
          <span className="fast-text">rapidement</span>
        </h1>
        <p className="subtitle">Approbation rapide • Taux compétitifs • Conditions flexibles</p>
      </div>

      <div className="calculator-content">
        <div className="calculator-section">
          <h2 className="section-title">Calculateur de prêt</h2>
          
          <div className="calculator-control">
            <label className="control-label">Montant du prêt</label>
            <div className="amount-display">USD 10,000</div>
          </div>

          <div className="calculator-control">
            <label className="control-label">Durée du prêt</label>
            <div className="term-display">12 mois</div>
          </div>

          <div className="payment-display">
            <div className="payment-label">Paiement mensuel</div>
            <div className="payment-amount">USD 850</div>
            <div className="interest-rate">Taux d'intérêt : 5.5% APR</div>
          </div>

          <button className="apply-button">Postulez dès maintenant</button>
        </div>

        <div className="features-section">
          <div className="feature-card">
            <div className="feature-icon">✓</div>
            <div className="feature-content">
              <h3 className="feature-title">Approbation rapide</h3>
              <p className="feature-desc">Dans les 24 heures</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <div className="feature-content">
              <h3 className="feature-title">Tarifs bas</h3>
              <p className="feature-desc">À partir de 8 %</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <div className="feature-content">
              <h3 className="feature-title">Sécurisé</h3>
              <p className="feature-desc">Sécurité de niveau bancaire</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard