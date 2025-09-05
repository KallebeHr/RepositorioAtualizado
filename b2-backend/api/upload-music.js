import axios from "axios"
import crypto from "crypto"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    console.log("📩 Upload recebido")

    const { B2_KEY_ID, B2_APP_KEY, B2_BUCKET_ID, B2_BUCKET_NAME } = process.env

    // autorizar
    const authResp = await axios.get("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
      auth: { username: B2_KEY_ID, password: B2_APP_KEY },
    })
    const { authorizationToken, apiUrl, downloadUrl } = authResp.data

    // pegar uploadUrl
    const uploadUrlResp = await axios.post(
      `${apiUrl}/b2api/v2/b2_get_upload_url`,
      { bucketId: B2_BUCKET_ID },
      { headers: { Authorization: authorizationToken } }
    ) 
    const { uploadUrl, authorizationToken: uploadAuth } = uploadUrlResp.data

    // OBS: em Serverless, o Vercel não aceita `req.file` direto.
    // Para testar, vamos só simular um retorno sem upload:
    // (Se quiser upload real, precisa usar `busboy` ou `formidable` pra ler o arquivo)

    const fileName = `teste-${Date.now()}.mp3`

    const publicUrl = `${downloadUrl}/file/${B2_BUCKET_NAME}/${encodeURIComponent(fileName)}`

    console.log("✅ Upload finalizado:", publicUrl)

    return res.status(200).json({
      fileId: fileName,
      downloadUrl: publicUrl,
    })
  } catch (err) {
    console.error("❌ Erro upload:", err.response?.data || err.message)
    return res.status(500).json({ error: "Erro no upload", details: err.message })
  }
}
