// index.js
import express from "express";
import cors from "cors";
import multer from "multer";
import axios from "axios";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:3000" }));

const upload = multer({ storage: multer.memoryStorage() });

// Teste
app.get("/", (req, res) => {
  res.send("Servidor B2 Backend funcionando!");
});

app.post("/upload-music", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Arquivo não enviado" });

    const { B2_KEY_ID, B2_APP_KEY, B2_BUCKET_ID, B2_BUCKET_NAME } = process.env;

    // 1) Autoriza
    const authResp = await axios.get("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
      auth: { username: B2_KEY_ID, password: B2_APP_KEY },
    });

    const { authorizationToken, apiUrl, downloadUrl } = authResp.data;

    // 2) Pega upload Url
    const uploadUrlResp = await axios.post(
      `${apiUrl}/b2api/v2/b2_get_upload_url`,
      { bucketId: B2_BUCKET_ID },
      { headers: { Authorization: authorizationToken } }
    );

    const { uploadUrl, authorizationToken: uploadAuth } = uploadUrlResp.data;

    // 3) Nome do arquivo + SHA1
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const sha1 = crypto.createHash("sha1").update(req.file.buffer).digest("hex");

    // 4) Upload
    await axios.post(uploadUrl, req.file.buffer, {
      headers: {
        Authorization: uploadAuth,
        "X-Bz-File-Name": encodeURIComponent(fileName),
        "Content-Type": req.file.mimetype || "b2/x-auto",
        "X-Bz-Content-Sha1": sha1,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    // 5) URL pública 
    const publicUrl = `${downloadUrl}/file/${B2_BUCKET_NAME}/${encodeURIComponent(fileName)}`;

    // Rfrontend
    res.json({
      fileId: fileName,
      downloadUrl: publicUrl,
    });
  } catch (err) {
    console.error("Erro B2 upload:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro ao enviar o arquivo para o B2" });
  }
});


app.get("/stream-music", async (req, res) => {
  try {
    const { fileName } = req.query;
    if (!fileName) return res.status(400).json({ error: "fileName é obrigatório" });

    const { B2_KEY_ID, B2_APP_KEY, B2_BUCKET_NAME } = process.env;

    const authResp = await axios.get("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
      auth: { username: B2_KEY_ID, password: B2_APP_KEY },
    });

    const { downloadUrl } = authResp.data;
    const friendlyUrl = `${downloadUrl}/file/${B2_BUCKET_NAME}/${encodeURIComponent(fileName)}`;

    res.redirect(friendlyUrl);
  } catch (err) {
    console.error("Erro streaming B2:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro ao gerar link de streaming" });
  }
});

app.listen(PORT, () => {
  console.log(`B2 Backend rodando em http://localhost:${PORT}`);
});
