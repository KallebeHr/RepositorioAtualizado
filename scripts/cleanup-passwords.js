import {database,FieldValue,timestamp} from '../api/_lib/admin.js'
const db=database(),apply=process.argv.includes('--apply'),snapshot=await db.collection('users').get();const affected=snapshot.docs.filter(s=>Object.hasOwn(s.data(),'password'))
console.log(`${affected.length} contas possuem campo legado de senha. Nenhum valor será exibido.`)
if(!apply){console.log('Prévia somente. Use --apply para remover exclusivamente esse campo.');process.exit(0)}
for(let i=0;i<affected.length;i+=400){const batch=db.batch();for(const s of affected.slice(i,i+400))batch.update(s.ref,{password:FieldValue.delete()});await batch.commit()}
await db.collection('audit').add({actor:'maintenance',action:'security.password-cleanup',details:{count:affected.length},at:timestamp()});console.log('Campos removidos. As senhas do Firebase Authentication foram preservadas.')
