import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { documentoDaParte, partesVisiveis } from '../src/services/repertorio-model.mjs'

const regras = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8')
const bloco = regras.slice(regras.indexOf('function parteDoRepertorio'), regras.indexOf('match /{document=**}'))
// No Firestore, matches() exige casar a string inteira (semântica RE2).
const matches = (valor, padrao) => new RegExp('^(?:' + padrao + ')$').test(valor)
const padroes = [...bloco.matchAll(/\.matches\('([^']+)'\)/g)].map(m => m[1])
const upload = { downloadUrl: 'https://pub-x.r2.dev/repertorios/u-Parte%201.zip', objectKey: 'repertorios/u-Parte 1.zip', size: 1610612736, fileName: 'Parte 1.zip', contentType: 'application/zip' }

test('as regras de repertorios usam padrões que cobrem a string inteira', () => {
  assert.equal(padroes.length, 2, 'esperava 2 matches() na função da parte')
  const doc = documentoDaParte({ nome: 'Novembro Parte 1', ordem: 1, senha: '', ativo: true, arquivo: upload })
  assert.ok(matches(doc.url, padroes.find(p => p.includes('https'))), 'url precisa casar com o padrão da regra')
  assert.ok(matches(doc.objectKey, padroes.find(p => p.includes('repertorios'))), 'objectKey precisa casar com o padrão da regra')
})

test('o documento gravado só tem campos que a regra permite', () => {
  const permitidos = [...bloco.match(/hasOnly\(\[([^\]]+)\]/)[1].matchAll(/'(\w+)'/g)].map(m => m[1])
  const doc = { ...documentoDaParte({ nome: 'A', ordem: 0, senha: 'x', ativo: true, arquivo: upload }), atualizadoEm: 1, criadoEm: 1 }
  assert.deepEqual(Object.keys(doc).filter(k => !permitidos.includes(k)), [])
  assert.ok(Number.isInteger(doc.tamanho) && doc.tamanho > 0)
  assert.equal(doc.contentType, 'application/zip')
})

test('editar sem novo arquivo não inclui campos do arquivo', () => {
  const doc = documentoDaParte({ nome: 'A', ordem: 2, senha: '', ativo: false, arquivo: null })
  assert.deepEqual(Object.keys(doc).sort(), ['ativo', 'nome', 'ordem', 'senha'])
})

test('a regra não usa if/let dentro da função (a linguagem não aceita)', () => {
  const corpo = bloco.slice(0, bloco.indexOf('match /repertorios'))
  assert.ok(!/\bif\s*\(/.test(corpo) && !/\blet\s/.test(corpo))
})

test('a lista do usuário filtra ocultas e ordena', () => {
  const lista = partesVisiveis([{ nome: 'b', ordem: 2, url: 'u' }, { nome: 'a', ordem: 1, url: 'u' }, { nome: 'x', ativo: false, url: 'u' }, { nome: 'sem' }])
  assert.deepEqual(lista.map(p => p.nome), ['a', 'b'])
})
