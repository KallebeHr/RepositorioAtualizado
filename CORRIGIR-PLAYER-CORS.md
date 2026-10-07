# Corrigir o player e o CORS

O registro informado mostra dois problemas separados:

1. `Howl2.onplay` e `Falha ao capturar áudio do Howler` pertencem ao player anterior. Esta versão usa um único elemento Audio e cria uma única fonte Web Audio, compartilhada entre as páginas.
2. A URL `f005.backblazeb2.com/file/RepertorioAtualizado/...` é do **Backblaze B2**. O arquivo respondeu HTTP 206 na consulta real, mas sem `Access-Control-Allow-Origin` para `http://localhost:3000`. O navegador bloqueia o player com equalizador e os downloads, mesmo quando o servidor retorna 200/206. As regras do Firebase não corrigem esse cabeçalho do B2.

## 1. Iniciar o projeto atualizado

Pare o servidor anterior com **Ctrl+C**. Extraia este ZIP em uma pasta nova, sem misturar os arquivos com o projeto anterior. Abra o PowerShell na pasta que contém este guia e o `package.json`:

```powershell
npm ci
npm run api:setup
npm run app:local
```

Abra `http://localhost:3000`. O comando gera a versão completa, com instalação e reabertura offline, e exige a porta 3000 livre. A barra com **Instalar app**, **Ouvir offline** e **Equalizador** aparece logo abaixo do menu. Para desenvolvimento, você também pode executar `npm run dev -- --force --strictPort`, mas confira instalação e reabertura offline com `npm run app:local`.

Para confirmar que você está na pasta nova:

```powershell
Select-String -Path .\src\stores\usePlayerStore.js -SimpleMatch -Pattern 'new Howl(', 'createMediaElementSource(audio)'
```

O resultado deve mostrar apenas a linha com `createMediaElementSource(audio)`. Não deve mostrar `new Howl(`.

Se o navegador continuar exibindo o player anterior, no Console de **localhost:3000** execute:

```js
navigator.serviceWorker.getRegistrations().then(registros => Promise.all(registros.map(registro => registro.unregister())))
```

Depois feche todas as abas desse localhost e abra novamente. Isso remove o registro antigo do aplicativo, sem apagar os arquivos de áudio salvos no IndexedDB. Não use a opção de limpar todos os dados do site se quiser manter sua biblioteca offline.

## 2. Liberar o áudio no B2

Em outro terminal na mesma pasta, consulte as regras do bucket com as credenciais B2 que já estão no backend:

```powershell
npm run b2:cors:check
```

Esse comando só consulta e mostra as regras atuais e a proposta. Para aplicar:

```powershell
npm run b2:cors
```

O comando adiciona uma regra de download para localhost, 127.0.0.1 e os dois domínios do Repertório Atualizado. Preserva as outras regras CORS, guarda uma cópia das regras anteriores em `b2-backend/b2-cors-backup-*.json` e confere a revisão do bucket antes de alterar. O payload enviado contém somente o ID do bucket/conta, CORS e a revisão; não altera visibilidade, arquivos, ciclo de vida ou retenção.

Para consultar, a chave precisa da permissão `listBuckets`; para aplicar, precisa também de `writeBuckets`. Se aparecer falta de permissão, configure CORS no painel do B2 ou use uma chave com essas permissões somente no backend. Não coloque uma chave privada no Vue, no Firebase ou em mensagem de chat.

Se preferir configurar pelo painel, acrescente a seguinte regra à lista existente do bucket **RepertorioAtualizado**, usando a estrutura da API nativa B2:

```json
{
  "corsRuleName": "repertorio-player-downloads",
  "allowedOrigins": [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://www.repertorioatualizado.com.br",
    "https://repertorioatualizado.com.br"
  ],
  "allowedOperations": ["b2_download_file_by_name", "b2_download_file_by_id"],
  "allowedHeaders": ["range"],
  "exposeHeaders": ["Content-Length", "Content-Range", "Accept-Ranges", "Content-Type", "ETag"],
  "maxAgeSeconds": 3600
}
```

Não substitua a lista inteira por esse objeto se houver outras regras de upload/download. O script realiza a junção automaticamente. Na API nativa B2, `corsRules` é uma lista de objetos.

Feche e reabra o navegador para testar sem uma resposta anterior no cache. No painel Network, a resposta do MP3 deve incluir `Access-Control-Allow-Origin: http://localhost:3000` (ou `*`, se outra regra apropriada já liberar todas as origens).

**R2 usa uma configuração separada**, com `AllowedOrigins`/`AllowedMethods`, descrita em `COMECE-AQUI.md`. Não copie a estrutura da API nativa B2 no painel R2.

## 3. Conferir

1. Toque em uma música normal, troque para V2 e Pastas e confira que o equalizador continua disponível.
2. Teste **Baixar** e **Salvar offline** com um áudio real de cada bucket.
3. Não devem aparecer `HTMLMediaElement already connected` nem chamadas do Howler no fluxo deste player. Se ainda aparecerem, a aba ou o servidor continuam executando arquivos anteriores.

O carrossel normal também foi corrigido para usar apenas o player global. Downloads bloqueados mostram uma mensagem com conexão/CORS, sem gerar promessa rejeitada sem tratamento. O nome/extensão original do arquivo é preservado quando consta no cadastro.

Referências oficiais: https://www.backblaze.com/docs/cloud-storage-cross-origin-resource-sharing-rules e https://www.backblaze.com/apidocs/b2-update-bucket.
