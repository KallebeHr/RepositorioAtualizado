import test from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
test('atualização v2 para v3 preserva áudio e perfil e cria central de downloads',async()=>{
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('repertorio-offline',2);r.onupgradeneeded=()=>{const t=r.result.createObjectStore('tracks',{keyPath:'key'});t.createIndex('owner','owner');r.result.createObjectStore('blobs',{keyPath:'key'});r.result.createObjectStore('data',{keyPath:'key'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
 const track={id:'existing',title:'Salva antes',collectionName:'musicasV2',downloadUrl:'https://media.test/existing.mp3'}
 await new Promise((resolve,reject)=>{const tx=db.transaction(['tracks','blobs','data'],'readwrite');tx.objectStore('tracks').put({key:'alice:v2:existing',owner:'alice',track,size:5,savedAt:1});tx.objectStore('blobs').put({key:'alice:v2:existing',blob:new Blob(['audio'])});tx.objectStore('data').put({key:'profile:repertorio-cd75a:alice',value:{uid:'alice'}});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close()
 const {listOffline,readLocalData,getTrackBlob,storeDownloadJob,listDownloadJobs}=await import('../src/services/offline.js');assert.equal((await listOffline('alice')).length,1);assert.equal(await(await getTrackBlob('alice',track)).text(),'audio');assert.equal((await readLocalData('profile:repertorio-cd75a:alice')).uid,'alice');await storeDownloadJob('alice',{id:'new-job',tracks:[track],status:'paused'});assert.equal((await listDownloadJobs('alice')).length,1)
})
