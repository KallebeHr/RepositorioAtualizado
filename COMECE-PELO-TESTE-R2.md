# Testar R2 separado do sistema atual

O site publicado, o bucket B2 e os documentos do Firebase não foram alterados por esta entrega. Esta é uma cópia para testar localmente. Não publique esta cópia sobre o site atual antes de concluir os testes.

## Preparar

1. Extraia este ZIP em **outra pasta**, sem substituir a pasta do projeto atual.
2. Abra a pasta repertoriozezao no VS Code. Use Node.js 22 ou superior.
3. O arquivo privado `b2-backend/.env.r2-teste` já contém o bucket, as credenciais S3 fornecidas e a URL pública r2.dev. Ele não deve ir para o GitHub nem ser compartilhado. Não incluímos as credenciais B2 antigas.
4. O arquivo `b2-backend/.env` da API atual não deve ser substituído. A nova API de teste lê somente `.env.r2-teste` e usa a porta 3002.
5. No painel R2, bucket `repertorio-atualizado-audios` → Settings → CORS Policy, acrescente **http://localhost:3003** e **http://127.0.0.1:3003** às origens existentes. Preserve os domínios de produção e as origens 3000. Mantenha GET, HEAD e o cabeçalho range permitidos. A página precisa desse CORS para verificar/download de áudio. Nenhum dado do Firebase é necessário.

## Iniciar

No terminal da nova pasta:

```powershell
npm install
npm run api:setup
npm run api:teste
```

Deixe esse terminal aberto. Em outro terminal, na mesma pasta:

```powershell
npm run dev:teste
```

Abra **http://localhost:3003/TesteR2**.

O frontend de teste usa 3003, a API de teste usa 3002. A API atual pode continuar em 3001 e o projeto local atual pode continuar em 3000. Não execute `npm run api` para esse teste.

## Testar pela página

1. Clique em Verificar servidor local. Isso confere a configuração e o modo teste, não autentica na conta R2.
2. Selecione um áudio pequeno e clique em Enviar apenas para o R2 de teste.
3. O arquivo será enviado para a pasta `testes/` do bucket. Não será cadastrado no Firebase e não aparecerá no catálogo normal.
4. Ouça no player próprio da página e use Abrir arquivo público.
5. Clique em Verificar download e intervalos. A página compara SHA-256 do arquivo enviado e do baixado e confere a resposta parcial do áudio.
6. Use Baixar arquivo.
7. Use Carregar áudio local para teste, desconecte a internet e dê play **sem sair da página**. Essa cópia fica na memória; não é a biblioteca persistente Offline do aplicativo.
8. Ao finalizar, remova somente o objeto mostrado sob `testes/` no painel R2. A página não apaga objetos automaticamente.

## Teste automático opcional no seu computador

```powershell
npm run testar:r2
```

Envia um áudio sintético de um segundo sob testes/, confere download público, CORS de localhost:3000, SHA-256 e intervalo de bytes. Depois remove somente o próprio objeto criado. Não precisa iniciar a API e não escreve no Firebase.

## Se houver falha

- Conexão recusada em 3002: inicie `npm run api:teste` e mantenha o terminal aberto.
- Configuração ausente: confirme a presença de `b2-backend/.env.r2-teste`.
- Envio 502: confira as credenciais R2 e a conexão do seu computador; o backend não registra a chave secreta.
- Reprodução/download 403: confirme o Public Development URL habilitado e a URL do arquivo específico; a URL raiz do bucket não lista arquivos.
- Failed to fetch no download: confira o CORS incluindo porta 3003.
- Porta 3003 ocupada: feche somente o processo de teste anterior; preserve os processos do projeto atual.

## O que ainda está pendente

34 testes automatizados e build de produção aprovados. O teste real de upload não foi concluído aqui por falha de DNS no acesso S3. Execute o teste local acima para confirmar as credenciais e o bucket. A instalação PWA/mobile não foi validada visualmente neste ambiente.

Não copiamos o acervo B2, não redirecionamos seus links existentes e não publicamos esta versão no site atual. O endereço r2.dev é para testes; a entrega de produção precisa de domínio próprio/configuração de capacidade adequada.

Para o catálogo paralelo R2 + Firebase desta edição, siga COMECE-AQUI-MUSICAS-V2.md.
