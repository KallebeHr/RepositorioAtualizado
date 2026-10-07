# Repertório Atualizado

Abra **COMECE-AQUI.md** para instalar e usar esta versão. Login, contas e catálogos continuam no Firebase `repertorio-d3552`. O áudio normal usa B2 e o V2 usa R2 pelas APIs locais.

## Iniciar a versão instalável no computador

Pare o servidor anterior, extraia em uma pasta nova e execute na pasta com `package.json`:

```powershell
npm ci
npm run api:setup
npm run app:local
```

Abra `http://localhost:3000`. Os botões **Instalar app**, **Ouvir offline** e **Equalizador** ficam na barra abaixo do menu, no computador e no celular.

## Guias incluídos

- **COMECE-AQUI.md**: instalação, contas, chaves, regras, envios, aplicativo e publicação.
- **CORRIGIR-PLAYER-CORS.md**: versão do player e bloqueio do áudio B2; `npm run b2:cors:check` consulta e `npm run b2:cors` aplica a regra de download preservando as existentes.
- **STATUS-VALIDACAO.md**: testes realizados e limites da validação.
- **REVISAO-DAS-TELAS.md**: capturas conferidas dos controles e das telas.

A reprodução continua durante a navegação interna. Instalação no aparelho, CORS dos serviços reais e execução em segundo plano precisam ser conferidos conforme os guias. As regras e o site público não foram publicados automaticamente.
