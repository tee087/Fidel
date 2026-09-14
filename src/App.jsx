import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login.jsx'
import Apply from './components/Apply.jsx'
import Verification from './components/Verification.jsx'
import Success from './components/Success.jsx'
import Dashboard from './components/Dashboard.jsx'
import Compliance from './components/Compliance.jsx'
import MessageUser from './components/MessageUser.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/:user" element={<Dashboard />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/success" element={<Success />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/message" element={<MessageUser />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
