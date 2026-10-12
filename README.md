# Repertório Atualizado — Firebase único + R2

Vue 3, Vuetify, Pinia e Vite. Firebase **repertorio-cd75a** para Authentication/Firestore; R2 para os áudios. Publicação do frontend na Vercel. API de envio local na porta 3004.

- `COMECE-AQUI.md`: instalação, Firebase, administrador, R2, pastas e publicação.
- `MIGRACAO-FIREBASE-R2.md`: ferramenta para copiar contas/perfis, chaves, catálogo e áudios antigos.
- `PLAYER-NOVO.md`: componente visual do player global e controles.
- `STATUS-VALIDACAO.md`: testes executados e limites da validação.

As páginas de músicas, cantores, pastas e favoritos consultam o catálogo único `musicasV2`. Pastas permitem ouvir, adicionar à fila, baixar ZIP e salvar offline. O player continua pela pasta da última música quando a fila termina, com opção para desativar. Chaves limitadas/ilimitadas, paginação administrativa, PWA e equalizador permanecem disponíveis.

```powershell
npm ci
npm run api:setup
npm run api
```

Em outro terminal: `npm run dev`. Para produção: `npm run build`. A configuração do Firebase foi alterada; a migração dos dados e a publicação remota precisam ser realizadas conforme os guias.
