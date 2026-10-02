import {mkdir,writeFile,readFile} from 'node:fs/promises'
import {Timestamp} from 'firebase-admin/firestore'
import {database,timestamp} from '../api/_lib/admin.js'
import {backupCollections,encode,decode} from '../server/backup.js'
const db=database();const restoreIndex=process.argv.indexOf('--restore')
if(restoreIndex>=0){
 const backup=JSON.parse(await readFile(process.argv[restoreIndex+1],'utf8'));if(backup.version!==1 || !Array.isArray(backup.documents))throw Error('Backup inválido')
 const data=backup.documents.filter(d=>backupCollections.includes(d.collection) && !['activationKeys','Chaves','audit','downloads','fileHashes','payments','migrations','accesses'].includes(d.collection));if(data.some(d=>typeof d.id!=='string'||d.id.includes('/')))throw Error('ID inválido')
 console.log(`Prévia: ${data.length} documentos. Coleções financeiras e consumo de chaves não serão rebobinados.`)
 if(!process.argv.includes('--apply'))process.exit(0)
 for(let i=0;i<data.length;i+=400){const batch=db.batch();for(const d of data.slice(i,i+400)){const value=decode(d.data,Timestamp);if(d.collection==='users')for(const key of ['role','disabled','subscription','subscriptionStart','subscriptionEnd','password'])delete value[key];batch.set(db.collection(d.collection).doc(d.id),value,{merge:true})}await batch.commit()}
 await db.collection('audit').add({actor:'maintenance',action:'backup.restore-cli',details:{count:data.length},at:timestamp()});console.log('Recuperação concluída.');process.exit(0)
}
const documents=[];for(const collection of backupCollections){const snap=await db.collection(collection).get();for(const d of snap.docs)documents.push({collection,id:d.id,data:encode(d.data())})}
await mkdir('backups-local',{recursive:true});const path=`backups-local/repertorio-${Date.now()}.json`;await writeFile(path,JSON.stringify({version:1,createdAt:new Date().toISOString(),documents}),{mode:0o600});console.log(`Backup criado: ${path} (${documents.length} documentos). Áudios e usuários do Authentication precisam de backup separado.`)
