import axios from "axios"

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { fileName } = req.query
    if (!fileName) return res.status(400).json({ error: "fileName é obrigatório" })

    const { B2_KEY_ID, B2_APP_KEY, B2_BUCKET_NAME } = process.env

    const authResp = await axios.get("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
      auth: { username: B2_KEY_ID, password: B2_APP_KEY },
    })

    const { downloadUrl } = authResp.data
    const friendlyUrl = `${downloadUrl}/file/${B2_BUCKET_NAME}/${encodeURIComponent(fileName)}`

    return res.redirect(friendlyUrl)
  } catch (err) {
    console.error("❌ Erro stream:", err.response?.data || err.message)
    return res.status(500).json({ error: "Erro ao gerar link" })
  }
}
