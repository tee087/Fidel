import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login.jsx'
import Apply from './components/Apply.jsx'
import Verification from './components/Verification.jsx'
import Success from './components/Success.jsx'
import Dashboard from './components/Dashboard.jsx'
import Compliance from './components/Compliance.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/default" replace />} />
        <Route path="/:user" element={<Dashboard />} />
        <Route path="/:user/apply" element={<Apply />} />
        <Route path="/:user/login" element={<Login />} />
        <Route path="/:user/verification" element={<Verification />} />
        <Route path="/:user/success" element={<Success />} />
        <Route path="/:user/compliance" element={<Compliance />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
