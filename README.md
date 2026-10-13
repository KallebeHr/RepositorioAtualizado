# Repertório Atualizado — Firebase único + R2

Vue 3, Vuetify, Pinia e Vite. Firebase **repertorio-cd75a** para Authentication/Firestore; R2 para os áudios. Publicação do frontend na Vercel. API de envio local na porta 3004.

- `COMECE-AQUI.md`: instalação, Firebase, administrador, R2, pastas e publicação.
- `ADICIONAIS-E-DISPOSITIVOS.md`: equalizador por código, valores, avisos de liberação, aparelhos, alertas e publicação das novas regras/índices.
- `MIGRACAO-FIREBASE-R2.md`: ferramenta para copiar contas/perfis, chaves, catálogo e áudios antigos.
- `PLAYER-NOVO.md`: componente visual do player global e controles.
- `STATUS-VALIDACAO.md`: testes executados e limites da validação.

As páginas de músicas, cantores, pastas e favoritos consultam o catálogo único `musicasV2`. Pastas permitem ouvir, adicionar à fila e baixar ZIP. O player continua pela pasta da última música quando a fila termina, com opção para desativar. Chaves limitadas/ilimitadas e paginação administrativa foram preservadas. Contas comuns ativam o equalizador por código; a administração gera códigos e acompanha dispositivos recentes, com alerta acima de quatro.

**Nesta entrega, instalar o app e ouvir/salvar offline mostram “Em breve”.** O código anterior da PWA/IndexedDB foi preservado para futura liberação, junto dos arquivos já salvos. Consulte `ADICIONAIS-E-DISPOSITIVOS.md` para habilitar as flags depois. Videoclipes aparecem como anúncio em breve de R$ 20; adicionais de áudio são anunciados por R$ 5 a mais, com atendimento pelo suporte.

```powershell
npm ci
npm run api:setup
npm run api
```

Em outro terminal: `npm run dev`. Para produção: `npm run build`. Publique as regras e os índices atualizados no mesmo Firebase antes do site. Nenhuma migração ou publicação remota foi realizada nesta tarefa.
