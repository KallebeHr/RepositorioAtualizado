import axios from 'axios'
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { createV2Publisher } from './music-v2-model.mjs'

export const V2_UPLOAD_URL = (import.meta.env.VITE_V2_UPLOAD_API_URL || 'http://localhost:3004').replace(/\/$/, '')
export const publishV2 = createV2Publisher({
  upload: async row => {
    const form = new FormData()
    form.append('file', row.file)
    const response = await axios.post(V2_UPLOAD_URL + '/upload-music', form, {
      onUploadProgress: event => { if (event.total) row.progress = Math.round(event.loaded * 100 / event.total) },
    })
    return response.data
  },
  save: async (data, row) => {
    // Gera o ID no navegador sem ler o Firestore. Repetir uma pendência usa o mesmo ID.
    row.documentId ||= doc(collection(db, 'musicasV2')).id
    await setDoc(doc(db, 'musicasV2', row.documentId), { ...data, createdAt: serverTimestamp() })
    return { id: row.documentId }
  },
})
