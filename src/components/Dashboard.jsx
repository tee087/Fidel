import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

function Dashboard() {
const [loanAmount, setLoanAmount] = useState(10000)
  const [term, setTerm] = useState(12)
  const navigate = useNavigate()
  const { user } = useParams() || {}
  const minimumLoan = 1000
  const maximumLoan = 50000
  const annualRate = 5.5
  const progress = ((loanAmount - minimumLoan) / (maximumLoan - minimumLoan)) * 100
  const monthlyPayment = useMemo(() => {
    const monthlyRate = annualRate / 100 / 12
    return loanAmount * (monthlyRate * (1 + monthlyRate) ** term) / ((1 + monthlyRate) ** term - 1)
  }, [loanAmount, term])
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  const userId = user || 'default'

  return (
    <div className="loan-calculator-container">
      <div className="calculator-header">
        <h1 className="loan-app-title">Faites approuver votre pret <span className="fast-text">rapidement</span></h1>
        <p className="subtitle">Approbation rapide - Taux competitifs - Conditions flexibles</p>
      </div>
      <div className="calculator-content">
        <div className="calculator-section">
          <h2 className="section-title">Calculateur de pret</h2>
          <div className="calculator-control">
            <label className="control-label" htmlFor="loan-amount">Montant du pret</label>
            <output className="amount-display" htmlFor="loan-amount">{money.format(loanAmount)}</output>
            <div className="slider-container">
              <input id="loan-amount" className="amount-slider" type="range" min={minimumLoan} max={maximumLoan} step="500" value={loanAmount} onChange={(event) => setLoanAmount(Number(event.target.value))} style={{ '--slider-progress': `${progress}%` }} aria-valuetext={money.format(loanAmount)} />
              <div className="slider-labels" aria-hidden="true"><span>{money.format(minimumLoan)}</span><span>{money.format(maximumLoan)}</span></div>
            </div>
          </div>
          <div className="calculator-control">
            <span className="control-label">Duree du pret</span>
            <div className="term-display">{term} mois</div>
            <div className="term-buttons" role="group" aria-label="Duree du pret">
              {[12, 24, 36].map((months) => <button className={`term-button ${term === months ? 'active' : ''}`} type="button" key={months} onClick={() => setTerm(months)} aria-pressed={term === months}>{months} mois</button>)}
            </div>
          </div>
          <div className="payment-display">
            <div className="payment-label">Paiement mensuel</div>
            <output className="payment-amount" aria-live="polite">{money.format(monthlyPayment)}</output>
            <div className="interest-rate">Taux d'interet : {annualRate}% APR</div>
          </div>
          <button className="apply-button" type="button" onClick={() => navigate(`/${userId}/apply`)}>Postulez des maintenant</button>
        </div>
        <div className="features-section">
          <div className="feature-card"><div className="feature-icon">&#10003;</div><div className="feature-content"><h3 className="feature-title">Approbation rapide</h3><p className="feature-desc">Dans les 24 heures</p></div></div>
          <div className="feature-card"><div className="feature-icon">$</div><div className="feature-content"><h3 className="feature-title">Tarifs bas</h3><p className="feature-desc">A partir de 8 %</p></div></div>
          <div className="feature-card"><div className="feature-icon">&#128274;</div><div className="feature-content"><h3 className="feature-title">Securise</h3><p className="feature-desc">Securite de niveau bancaire</p></div></div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
