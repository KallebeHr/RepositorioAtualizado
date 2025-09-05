import { IncomingForm } from "formidable";
import axios from "axios";
import crypto from "crypto";
import fs from "fs";

// Configuração serverless: desativa bodyParser nativo
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!files.file) return res.status(400).json({ error: "Arquivo não enviado" });

    try {
      const { B2_KEY_ID, B2_APP_KEY, B2_BUCKET_ID, B2_BUCKET_NAME } = process.env;
      const file = files.file;

      // 1) Autoriza no B2
      const authResp = await axios.get(
        "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
        { auth: { username: B2_KEY_ID, password: B2_APP_KEY } }
      );

      const { authorizationToken, apiUrl, downloadUrl } = authResp.data;

      // 2) Pega upload URL
      const uploadUrlResp = await axios.post(
        `${apiUrl}/b2api/v2/b2_get_upload_url`,
        { bucketId: B2_BUCKET_ID },
        { headers: { Authorization: authorizationToken } }
      );

      const { uploadUrl, authorizationToken: uploadAuth } = uploadUrlResp.data;

      // 3) Nome + SHA1
      const fileName = `${Date.now()}-${file.originalFilename}`;
      const fileBuffer = fs.readFileSync(file.filepath);
      const sha1 = crypto.createHash("sha1").update(fileBuffer).digest("hex");

      // 4) Upload
      await axios.post(uploadUrl, fileBuffer, {
        headers: {
          Authorization: uploadAuth,
          "X-Bz-File-Name": encodeURIComponent(fileName),
          "Content-Type": file.mimetype || "b2/x-auto",
          "X-Bz-Content-Sha1": sha1,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      // 5) URL pública
      const publicUrl = `${downloadUrl}/file/${B2_BUCKET_NAME}/${encodeURIComponent(fileName)}`;

      res.status(200).json({ fileId: fileName, downloadUrl: publicUrl });
    } catch (error) {
      console.error("Erro B2 upload:", error.response?.data || error.message);
      res.status(500).json({ error: "Erro ao enviar o arquivo para o B2" });
    }
  });
}
