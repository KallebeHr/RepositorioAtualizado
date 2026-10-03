# Repertório Atualizado — configuração e publicação

A versão 2 usa o mesmo projeto Firebase e a coleção `musicas` existentes. Não execute importações em outro projeto por engano. A implementação está disponível para revisão, mas uploads, autorização de arquivos, ativação e pagamentos precisam das configurações abaixo. Nenhuma migração ou limpeza de dados reais foi executada durante a implementação.

## 1. Antes da troca em produção

1. Configure as variáveis do servidor na Vercel (Settings → Environment Variables), para Preview primeiro. Use `.env.server.example` como referência; não envie segredos pelo código nem os exponha com `VITE_`.
2. Firebase Console → Configurações do projeto → Contas de serviço → Gerar nova chave privada. Use o JSON completo em `FIREBASE_ADMIN_CREDENTIALS_JSON`. Confirme o `project_id` do catálogo atual (`repertorio-d3552`) e do Authentication atual. O projeto do ZIP contém um `authDomain` de nome diferente: confirme os domínios autorizados do Authentication antes de produção.
3. Confirme que as contas administrativas têm `users/{uid}.role = "admin"`. Não é possível promover-se pelo site. Faça o primeiro ajuste pela console, como proprietário do projeto.
4. Na Cloudflare, crie um bucket R2 Standard **privado**. Gere um token S3 limitado a leitura e gravação nesse bucket. Preencha endpoint, chave, segredo e nome do bucket.
5. Configure CORS pelo exemplo `docs/R2-CORS.json`. Substitua `https://SEU_DOMINIO` pelo endereço efetivo, incluindo a URL de Preview quando testar. Não use `*` como origem por padrão.
6. Faça um upload e um download com uma conta real de teste. Confirme que a API reconhece assinatura, impede usuário comum de subir arquivos e bloqueia downloads expirados.
7. Depois da API funcionar, publique as regras Firebase e faça o teste novamente. Não publique apenas as novas regras sobre o frontend antigo: o fluxo antigo grava dados que agora serão bloqueados.
8. Somente depois dessas verificações, troque a versão em produção.

No ZIP original havia uma chave B2 em arquivo `.env` versionado no GitHub. O novo ZIP e a nova versão do código excluem esse arquivo. A chave permanece no histórico antigo até ser revogada: gere outra chave e configure-a somente no servidor antes de usar B2.

## 2. Execução local (Windows/PowerShell)

```powershell
npm ci
Copy-Item .env.server.example .env.server
# Preencha .env.server localmente, sem publicar o arquivo.
npm run dev:api
```

Em outro terminal:

```powershell
npm run dev
```

A API local fica em `127.0.0.1:3001`; o Vite encaminha `/api` automaticamente. Em produção, as funções de `api/` são executadas pela Vercel e não dependem do seu computador.

## 3. Firebase: regras e testes

```powershell
npx firebase login
npx firebase deploy --only firestore:rules,firestore:indexes --project repertorio-d3552
```

Use uma conta autorizada no projeto correto. A configuração TTL de `rateLimits.expiresAt` evita acumular contadores temporários; TTL precisa estar ativa no projeto e sua aplicação é assíncrona.

As regras permitem leitura pública dos metadados do catálogo; novos áudios privados são acessados somente pela API. Metadados de músicas agendadas ficam no banco, mas a interface os oculta até a hora e a API bloqueia os arquivos. Caso seja necessário esconder também os metadados de lançamentos futuros, separe-os em coleção privada.

As URLs públicas B2 antigas continuam públicas durante a transição. Uma checagem na API não revoga links públicos já distribuídos. A proteção efetiva dos arquivos ocorre depois da migração e da desativação de acesso público ao bucket antigo, após confirmar as demais dependências.

## 4. Preparação de pacotes fora do celular

`npm run packages:worker` é um processo Node que transmite os áudios para um ZIP privado no armazenamento, sem montar tudo na memória do navegador. Não é uma função de longa duração da Vercel.

Configure um processo externo, com as mesmas variáveis do servidor, executando a cada poucos minutos:

```powershell
npm run packages:worker
```

Para antecipar pacotes por cantor, gênero e mês:

```powershell
npm run packages:worker -- --prepare
```

Para tentar novamente pacotes com falha:

```powershell
npm run packages:worker -- --retry-failed
```

O processo usa reserva transacional e prazo de recuperação para evitar que duas execuções preparem o mesmo pacote. Cada ciclo processa até 20 pacotes; grupos maiores são divididos em partes de até 200 músicas. Marque `PACKAGE_WORKER_CONFIGURED=true` somente depois que o agendamento estiver funcionando. Pedidos ficam pendentes enquanto esse processo não estiver ativo.

## 5. Migração gradual B2 → R2

1. Crie e guarde um backup.
2. Rode a prévia: `npm run migrate:r2`.
3. Para copiar os arquivos: `npm run migrate:r2 -- --apply`.
4. O script verifica a cópia, registra a origem numa coleção administrativa e muda o catálogo para usar chave privada do R2. Não apaga os arquivos no B2.
5. Teste reprodução, avanço e download de músicas migradas em vários dispositivos.
6. Desative a distribuição pública antiga apenas quando tiver certeza de que todos os consumidores foram migrados.

Durante a transição também é possível usar B2 por API S3, configurando `STORAGE_PROVIDER=b2` e as variáveis `B2_*` do exemplo. As variáveis do backend antigo (`B2_APP_KEY`, `B2_BUCKET_ID`) não equivalem automaticamente a uma configuração S3 completa.

### Metadados dos arquivos antigos

Para completar duração, tamanho e qualidade reais das músicas antigas, instale FFmpeg no processo externo e rode `npm run metadata:enrich`. Revise a prévia e aplique com `npm run metadata:enrich -- --apply`. O comando não altera os áudios. Enquanto os dados não forem medidos, a interface informa que não estão disponíveis.

## 6. Pagamento integrado (opcional)

A integração implementada usa Checkout Pro do Mercado Pago, em BRL, por 30 dias. O exemplo de preço é configuração, não orçamento comercial. Defina o valor real em `SUBSCRIPTION_PRICE_BRL`.

1. Configure token do vendedor, ID do recebedor e segredo de Webhooks.
2. Defina `PUBLIC_SITE_URL` com HTTPS e seu domínio.
3. Cadastre notificações de pagamentos em `https://SEU_DOMINIO/api/payment-webhook`.
4. Teste com credenciais de teste antes de usar produção.
5. A API consulta o pagamento no Mercado Pago e só ativa após status `approved`, valor e moeda corretos. A transação registra o ID do pagamento para não renovar duas vezes em notificações repetidas. A tela de retorno sozinha não libera acesso.

Sem configuração, o usuário recebe uma mensagem explícita e pode solicitar chave pelo WhatsApp. Não foram feitos pagamentos nem testes financeiros reais nesta atualização. Estornos não revogam automaticamente dias: exigem conciliação administrativa nesta versão.

## 7. Limpeza das senhas antigas

O novo cadastro não grava senha no Firestore. O utilitário remove somente o campo legado `password`, sem modificar Firebase Authentication:

```powershell
npm run cleanup:passwords
npm run cleanup:passwords -- --apply
```

A primeira execução mostra apenas a quantidade, nunca valores de senha. Depois da limpeza, revise o acesso que existia à coleção e avalie solicitar redefinição de senha às contas afetadas.

## 8. Backup e recuperação

- Painel: exportação privada para R2/B2 de até 3 MB e 2.000 documentos por coleção; recuperação exige prévia e confirmação.
- Bancos maiores: `npm run backup` exporta todas as coleções declaradas, sem o limite da resposta HTTP.
- Prévia de recuperação: `npm run backup -- --restore backups-local/ARQUIVO.json`.
- Aplicar: acrescente `--apply` depois de revisar.
- A recuperação atualiza documentos sem apagar documentos extras. Coleções financeiras, histórico de usos de chaves, migração e auditoria não são rebobinadas. Papéis, status e assinaturas de usuários existentes são preservados. Uma conta restaurada sem documento atual precisará ser reconciliada pelo administrador.
- Backups excluem senhas. Não incluem os bytes dos áudios/pacotes nem usuários do Firebase Authentication. Faça backup desses serviços separadamente.
- Recuperações grandes usam lotes; não são uma transação única. Se interrompidas, revise o histórico e repita o processo.

## 9. Verificação

```powershell
npm test
npm run test:integration
npx playwright install chromium
npm run test:browser
npm run build
```

Para emuladores use Java 17 com a versão do Firebase CLI fixada no projeto e Node 20/22. Os testes usam projetos `demo-*`, sem tocar nos dados reais. O teste de player usa áudio sintético e resposta de autorização simulada; testes da API/rules exercitam Firestore local. Os serviços externos ainda precisam da homologação descrita acima.

## 10. Vercel e GitHub

O último commit encontrado já tinha verificação Vercel em falha com link de solução de colaboração de projetos. Confirme que o proprietário do projeto Vercel tem acesso ao repositório privado e que o autor de commits tem permissão de implantação na equipe. Configure o repositório em Project → Settings → Git e revise o log de build.

A atualização deve entrar primeiro numa branch de revisão/Preview. A produção não deve ser substituída enquanto API, regras, armazenamento, pacotes e contas de teste não tiverem passado pelos testes reais. Nunca use o arquivo de conta de serviço como conteúdo de commit.
