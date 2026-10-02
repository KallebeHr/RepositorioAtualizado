# Configurar o Repertório Atualizado no R2, passo a passo

## O que fica onde

O site continua na Vercel em https://www.repertorioatualizado.com.br. O endereço sem www também deve apontar para o mesmo projeto, com redirecionamento para o endereço principal.

Firebase Authentication continua cuidando do cadastro, login e recuperação de senha. Firestore continua guardando usuários, assinaturas, músicas (informações), favoritos, playlists e histórico. R2 substitui o armazenamento dos arquivos de áudio e dos ZIPs. Nenhum cadastro precisa ser apagado ou recriado.

## 1. Criar ou acessar a Cloudflare

1. Abra https://dash.cloudflare.com/ e entre ou crie sua conta.
2. Abra **Storage & databases → R2 → Overview** (o menu também pode aparecer como **R2 Object Storage**).
3. Se solicitado, complete a ativação do R2 e os dados de cobrança. Confira os valores exibidos antes de confirmar. O serviço tem franquia mensal e pode gerar cobrança conforme o uso.
4. Para configuração acompanhada, envie uma captura dessa tela, ocultando informações financeiras e segredos.

Não é preciso transferir o domínio do Registro.br para a Cloudflare nem alterar os servidores DNS para começar a usar o armazenamento R2.

## 2. Criar o bucket

1. Clique em **Create bucket**.
2. Nome sugerido: `repertorio-atualizado-audios`.
3. Escolha **Standard** como classe padrão de armazenamento.
4. Confirme a criação. Mantenha o bucket **privado**. Não ative **Public Development URL / r2.dev** nem conecte um domínio público ao bucket.

O site autoriza o assinante na API e entrega um link temporário. O arquivo pode ter um endereço técnico da Cloudflare mesmo quando o usuário usa o site pelo domínio oficial. Esse comportamento é esperado e evita tornar o catálogo público.

## 3. Criar a credencial do bucket

1. Volte ao R2 e procure **Manage R2 API tokens** ou **Account Details → API Tokens → Manage**.
2. Crie um token de R2 com permissão **Object Read & Write**.
3. Restrinja o token ao bucket criado.
4. Guarde **Access Key ID**, **Secret Access Key** e o **S3 API endpoint**. O segredo não é exibido novamente.
5. O endpoint normalmente tem o formato `https://SEU_ACCOUNT_ID.r2.cloudflarestorage.com`.

Não coloque esses valores no código Vue, em variáveis `VITE_*`, no GitHub ou em capturas de tela. Insira os segredos diretamente no painel de variáveis da Vercel.

## 4. Permitir o envio pelo navegador (CORS)

No bucket, abra **Settings → CORS Policy → Add/Edit**. Cole o conteúdo de `docs/R2-CORS.json` deste projeto. Ele já inclui:

- `https://repertorioatualizado.com.br`
- `https://www.repertorioatualizado.com.br`
- os endereços de desenvolvimento local.

As operações permitidas são GET, HEAD e PUT, incluindo o cabeçalho de checksum usado no upload. Para testar uma prévia da Vercel, acrescente a origem exata da prévia temporariamente. Não use `*` como origem padrão.

Salve. CORS permite que o navegador acesse os links autorizados; ele não substitui a validação da assinatura.

## 5. Configurar a Vercel

Abra o projeto `repositorio-atualizado` na equipe `kallebehrs-projects` → **Settings → Environment Variables**. Cadastre para Production e para a Preview usada nos testes:

| Variável | Valor |
| --- | --- |
| `STORAGE_PROVIDER` | `r2` |
| `R2_BUCKET` | `repertorio-atualizado-audios` |
| `R2_ENDPOINT` | Endpoint S3 exibido pela Cloudflare |
| `R2_ACCESS_KEY_ID` | Access Key ID do token de R2 |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key do token de R2 |
| `FIREBASE_ADMIN_CREDENTIALS_JSON` | JSON de conta de serviço do Firebase atual |
| `PUBLIC_SITE_URL` | `https://www.repertorioatualizado.com.br` |

Mantenha pagamentos e preparação de pacotes desativados até configurá-los. Alterações de variáveis só passam a valer em uma nova implantação.

Para permitir que o assistente verifique esse projeto pela conexão Vercel, reconecte o aplicativo com acesso à equipe `kallebehrs-projects`. A conexão atual retornou 403 para essa equipe. Não é necessário fornecer sua senha.

## 6. Preparar o Firebase atual

1. Abra https://console.firebase.google.com/ e selecione o mesmo projeto usado no site (`repertorio-d3552`; confira antes de prosseguir).
2. Em **Project settings → Service accounts → Firebase Admin SDK**, gere uma chave privada apenas se não existir uma credencial válida já configurada na Vercel.
3. Insira o JSON completo em `FIREBASE_ADMIN_CREDENTIALS_JSON` no painel da Vercel.
4. Em **Authentication → Settings → Authorized domains**, confira `repertorioatualizado.com.br` e `www.repertorioatualizado.com.br`.
5. Preserve o provedor de login E-mail/Senha e os usuários existentes.
6. Publique as regras fornecidas em `firestore.rules` e os índices em `firestore.indexes.json` junto com a atualização da API. Faça backup antes e confira os acessos administrativos.

A API verifica o papel administrativo no documento de usuário existente. Uma chave de serviço de outro projeto não serve. Não reutilize credenciais de outros sistemas, como SEDUC.

## 7. Validar antes de migrar todo o catálogo

Primeiro teste com uma música pequena e uma conta de teste identificada, sem alterar assinantes reais:

1. Entre como administrador → **Administração → Enviar músicas**.
2. Informe cantor e gênero. Envie um áudio pequeno e aguarde progresso de 100% e confirmação.
3. Confira o objeto no R2 e a informação da música no Firestore (`storageProvider: r2` e `storageKey`).
4. Entre com uma conta de teste assinante. Reproduza, navegue pelas páginas, avance a fila e faça download.
5. Teste também no celular pelo domínio oficial.
6. Em uma conta sem assinatura, tente reproduzir e baixar: a API deve negar o arquivo.
7. Tente abrir o objeto sem a URL assinada: o bucket privado deve negar acesso.
8. Envie novamente o mesmo arquivo e confira o bloqueio de duplicação.

A publicação no domínio oficial exige que Firebase Admin e R2 estejam configurados. Um build aprovado não comprova que os serviços externos estão funcionando.

## 8. Como usar chaves reutilizáveis

No painel **Administração → Chaves**:

1. Escolha a duração da assinatura em dias.
2. Escolha o limite total de usos: **0 significa ilimitado**, 10 permite dez ativações no total, 1 mantém uso único.
3. Marque **Permitir renovação repetida pela mesma conta** somente quando quiser que uma conta use essa chave novamente. Desmarcada, cada conta usa uma vez, mas várias contas podem utilizar a mesma chave.
4. Gere a chave e copie-a no momento da criação. O servidor guarda apenas seu hash.
5. O usuário informa a chave em **Minha conta** ou no menu de ativação.
6. Os dias restantes são preservados. A contagem de usos é atualizada em transação, inclusive quando várias pessoas ativam simultaneamente.
7. Você pode revogar a chave para impedir novos usos; assinaturas já concedidas continuam válidas.

Chaves antigas ainda existentes na coleção `Chaves` continuam reutilizáveis entre contas. As chaves criadas anteriormente como uso único na coleção `activationKeys` preservam esse limite; gere uma nova chave para o novo modelo. O bloqueio de repetição por conta depende do histórico registrado a partir desta atualização.

Se você habilitar repetição sem limite, uma conta poderá renovar muitas vezes com a mesma chave. Use essa opção quando esse for o acesso que deseja conceder.

## 9. Migrar as músicas antigas sem apagar o B2

No computador, com Node e dependências instaladas, prepare `.env.server` a partir de `.env.server.example` (arquivo privado e ignorado pelo Git). Use:

```powershell
npm ci
npm run migrate:r2
```

O primeiro comando de migração apenas mostra o que será copiado. Leia a prévia. Para executar:

```powershell
npm run migrate:r2 -- --apply
```

O script copia arquivos, valida tamanho e conteúdo e atualiza o catálogo após verificar a cópia. Não apaga o B2. Links públicos antigos só deixam de expor a música quando também forem desativados no armazenamento de origem; mantenha essa etapa para depois da validação das cópias e do backup.

## 10. Pacotes ZIP

ZIPs são preparados fora do celular por `scripts/package-worker.js`. Configure os mesmos segredos em **GitHub → Settings → Secrets and variables → Actions** conforme `.github/workflows/prepare-packages.yml`, execute o workflow manualmente e valide um pacote pequeno. Só depois defina `PACKAGE_WORKER_CONFIGURED=true` na Vercel e reimplante.

Até o trabalhador estar configurado, downloads individuais podem funcionar, mas pedidos de novos pacotes não estão prontos para uso real. Backup, pagamentos e migração também precisam de testes próprios; não ative tudo de uma vez.

## Fontes oficiais

- https://developers.cloudflare.com/r2/get-started/
- https://developers.cloudflare.com/r2/get-started/s3/
- https://developers.cloudflare.com/r2/api/tokens/
- https://developers.cloudflare.com/r2/buckets/cors/
