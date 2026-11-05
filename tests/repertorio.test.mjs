import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { documentoDaParte, partesVisiveis, normalizarLink, tipoDaParte } from '../src/services/repertorio-model.mjs'

const regras = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8')
const bloco = regras.slice(regras.indexOf('function parteArquivo'), regras.indexOf('match /{document=**}'))
// No Firestore, matches() exige casar a string inteira (semântica RE2).
const matches = (valor, padrao) => new RegExp('^(?:' + padrao + ')$').test(valor)
const padroes = [...bloco.matchAll(/\.matches\('([^']+)'\)/g)].map(m => m[1])
const upload = { downloadUrl: 'https://pub-x.r2.dev/repertorios/u-Parte%201.zip', objectKey: 'repertorios/u-Parte 1.zip', size: 1610612736, fileName: 'Parte 1.zip', contentType: 'application/zip' }

test('as regras de repertorios usam padrões que cobrem a string inteira', () => {
  assert.ok(padroes.length >= 2, 'esperava padrões de https e de repertorios/')
  const doc = documentoDaParte({ nome: 'Novembro Parte 1', ordem: 1, senha: '', ativo: true, arquivo: upload })
  assert.ok(matches(doc.url, padroes.find(p => p.includes('https'))), 'url precisa casar com o padrão da regra')
  const padraoChave = padroes.find(p => p.includes('repertorios'))
  assert.ok(matches('repertorios/uuid-Parte1.zip', padraoChave), 'objectKey precisa casar com o padrão da regra')
  assert.ok(matches('repertorios/u-Parte 1.zip', padraoChave), 'chave com espaço também precisa casar')
  const externo = documentoDaParte({ nome: 'L', ordem: 9, senha: '', ativo: true, link: 'https://www.mediafire.com/file/a/b.zip/file' })
  assert.ok(matches(externo.url, padroes.find(p => p.includes('https'))), 'a URL do link externo precisa casar com o padrão da regra')
})

test('o documento gravado só tem campos que a regra permite', () => {
  const permitidos = [...bloco.match(/hasOnly\(\[([^\]]+)\]/)[1].matchAll(/'(\w+)'/g)].map(m => m[1])
  const doc = { ...documentoDaParte({ nome: 'A', ordem: 0, senha: 'x', ativo: true, arquivo: upload }), atualizadoEm: 1, criadoEm: 1 }
  assert.deepEqual(Object.keys(doc).filter(k => !permitidos.includes(k)), [])
  assert.ok(Number.isInteger(doc.tamanho) && doc.tamanho > 0)
  assert.equal(doc.contentType, 'application/zip')
})

test('editar sem novo arquivo não inclui campos do arquivo', () => {
  // Ao editar sem novo arquivo, o painel manda o link que já existe e o modelo devolve os campos do link.
  const doc = documentoDaParte({ nome: 'A', ordem: 2, senha: '', ativo: false, arquivo: null, link: 'https://www.mediafire.com/f/a' })
  assert.deepEqual(Object.keys(doc).sort(), ['ativo', 'nome', 'objectKey', 'ordem', 'senha', 'tipo', 'url'])
})

test('a regra não usa if/let dentro da função (a linguagem não aceita)', () => {
  const corpo = bloco.slice(0, bloco.indexOf('match /repertorios'))
  assert.ok(!/\bif\s*\(/.test(corpo) && !/\blet\s/.test(corpo))
})

test('a lista do usuário filtra ocultas e ordena', () => {
  const lista = partesVisiveis([
    { nome: 'b', ordem: 2, url: 'https://x/b', tipo: 'arquivo', objectKey: 'repertorios/b.zip' },
    { nome: 'a', ordem: 1, url: 'https://x/a', tipo: 'link' },
    { nome: 'x', ativo: false, url: 'https://x/x', tipo: 'link' },
    { nome: 'sem' },
  ])
  assert.deepEqual(lista.map(p => p.nome), ['a', 'b'])
})

test('a regra aceita link externo e a página sabe qual tipo é', () => {
  const link = documentoDaParte({ nome: 'Repertório Novembro', ordem: 3, senha: 'abcd', ativo: true, link: 'https://www.mediafire.com/file/abc/parte-1.zip/file' })
  assert.equal(link.tipo, 'link')
  assert.equal(link.url, 'https://www.mediafire.com/file/abc/parte-1.zip/file')
  assert.ok(link.objectKey.startsWith('link/'))
  assert.equal(tipoDaParte(link), 'link')
  const zip = documentoDaParte({ nome: 'Zip', ordem: 1, senha: '', ativo: true, arquivo: upload })
  assert.equal(tipoDaParte(zip), 'arquivo')
  // parte antiga, gravada antes do campo tipo, continua aparecendo como arquivo
  assert.equal(tipoDaParte({ url: 'https://x', objectKey: 'repertorios/a.zip' }), 'arquivo')
  assert.deepEqual(partesVisiveis([zip, link, { nome: 'sem url' }]).map(p => p.tipo).sort(), ['arquivo', 'link'])
})

test('o link é validado', () => {
  assert.throws(() => normalizarLink(''), /endereço do link/)
  assert.throws(() => normalizarLink('ftp://x/y'), /https/)
  assert.throws(() => normalizarLink('mediafire.com/file/a'), /não é um link válido/)
  assert.equal(normalizarLink(' https://www.mediafire.com/f/a/ '), 'https://www.mediafire.com/f/a')
  assert.throws(() => documentoDaParte({ nome: 'A', ordem: 0, senha: '', ativo: true }), /Envie um ZIP ou informe um link/)
})

test('parte sem arquivo nem link é recusada, e a regra cobre os campos do tipo', () => {
  const permitidos = [...bloco.match(/hasOnly\(\[([^\]]+)\]/)[1].matchAll(/'(\w+)'/g)].map(m => m[1])
  const link = { ...documentoDaParte({ nome: 'L', ordem: 0, senha: '', ativo: true, link: 'https://www.mediafire.com/f/a' }), criadoEm: 1, atualizadoEm: 1 }
  assert.deepEqual(Object.keys(link).filter(k => !permitidos.includes(k)), [])
  assert.ok(link.url.length > 0 && link.url.startsWith('https://'))
})
