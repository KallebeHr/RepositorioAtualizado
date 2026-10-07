import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { dirname,join,resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { S3Client,HeadObjectCommand } from '@aws-sdk/client-s3'
import { createApp,r2Configuration } from './r2-upload.js'
import { createV2Handler,identity } from '../server/v2-handler.mjs'
const directory=dirname(fileURLToPath(import.meta.url))
const loaded=dotenv.config({path:join(directory,'.env.v2'),override:true,quiet:true})
if(loaded.error)throw new Error('Arquivo b2-backend/.env.v2 ausente.')
if(process.env.FIREBASE_SERVICE_ACCOUNT_PATH && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON)process.env.FIREBASE_SERVICE_ACCOUNT_PATH=resolve(directory,process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
const app=express(),origins=new Set((process.env.ADMIN_ORIGINS || 'http://localhost:3000,http://localhost:3003,http://127.0.0.1:3000,http://127.0.0.1:3003').split(',').map(s=>s.trim()))
app.use((req,res,next)=>req.headers.origin&&!origins.has(req.headers.origin)?res.status(403).json({error:'Origem não autorizada.'}):next())
app.use(cors({origin:(origin,callback)=>callback(null,!origin||origins.has(origin))}));app.use(express.json({limit:'256kb'}))
app.use('/upload-music',async(req,res,next)=>{try{await identity(req,true);if(!/^[a-f0-9-]{36}$/i.test(req.headers['x-upload-id']||''))return res.status(400).json({error:'Identificador do envio ausente.'});next()}catch(e){res.status(e.status||503).json({error:e.status?e.message:'Firebase Admin não está configurado.'})}})
app.all('/api/v2',createV2Handler({verifyObject:async metadata=>{
 const config=r2Configuration(),client=new S3Client(config)
 try{const head=await client.send(new HeadObjectCommand({Bucket:config.bucket,Key:metadata.objectKey}));if(head.ContentLength!==metadata.size)throw new Error('Arquivo R2 não corresponde ao cadastro.')}finally{client.destroy()}
}}))
app.use(createApp({env:{...process.env,ADMIN_ORIGINS:[...origins].join(',')},objectPrefix:'musicas-v2'}))
app.listen(3004,'127.0.0.1',()=>console.log('API local Músicas V2: http://127.0.0.1:3004 — R2 + Firebase; envio autorizado apenas para admin.'))
