import test from 'node:test'
import assert from 'node:assert/strict'
import {reorderKeepingCurrent,moveQueueItem} from '../src/utils/queue-order.mjs'
const queue=[{id:'a',title:'A'},{id:'b',title:'B'},{id:'c',title:'C'}]
test('mover a música atual conserva identidade, objeto e posição lógica',()=>{const next=moveQueueItem(queue,1,1,0);assert.deepEqual(next.queue.map(t=>t.id),['b','a','c']);assert.equal(next.currentIndex,0);assert.equal(next.queue[0],queue[1]);assert.deepEqual(queue.map(t=>t.id),['a','b','c'])})
test('mover outra música ajusta índice atual sem substituí-la',()=>{const next=moveQueueItem(queue,1,0,2);assert.equal(next.currentIndex,0);assert.equal(next.queue[next.currentIndex],queue[1]);assert.deepEqual(next.queue.map(t=>t.id),['b','c','a'])})
test('fila restaurada pausada conserva faixa; fila sem faixa atual continua sem seleção',()=>{assert.equal(reorderKeepingCurrent(queue,1,[queue[2],queue[0],queue[1]]).currentIndex,2);assert.equal(reorderKeepingCurrent(queue,-1,[...queue].reverse()).currentIndex,-1);assert.deepEqual(reorderKeepingCurrent([],-1,[]),{queue:[],currentIndex:-1})})
test('reordenação recusa IDs novos, repetidos, exclusões e índices inválidos',()=>{assert.throws(()=>reorderKeepingCurrent(queue,0,[queue[0],queue[0],queue[2]]));assert.throws(()=>reorderKeepingCurrent(queue,0,[queue[0],queue[1],{id:'d'}]));assert.throws(()=>reorderKeepingCurrent(queue,0,[queue[0]]));assert.throws(()=>moveQueueItem(queue,0,1,-1));assert.throws(()=>moveQueueItem(queue,0,1,3))})
