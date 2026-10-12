# Migrar contas, perfis e músicas para o Firebase único

**Destino: repertorio-cd75a.** O site atualizado só consulta esse projeto e o catálogo `musicasV2`. Mudar `firebaseConfig` não transfere contas ou documentos. Os arquivos que ainda estão somente no B2 precisam ser copiados ao R2 para integrar o catálogo unificado.

A ferramenta opcional `b2-backend/migrate-to-unified.mjs` realiza essa cópia. Ela usa credenciais administrativas locais dos dois projetos, conserva os UIDs das contas e pode preservar as senhas por hash. Não usa senha em texto nos perfis. Ela não apaga arquivos ou documentos da origem e não sobrescreve documentos já existentes no destino.

## Antes de começar

1. Guarde um backup/exportação do projeto antigo. Avise os administradores e interrompa temporariamente novos cadastros, ativações e envios durante a migração, para manter uma fotografia consistente dos dados. Os ouvintes podem continuar usando a versão antiga até a publicação.
2. Habilite Authentication e Firestore no destino, conforme `COMECE-AQUI.md`.
3. Para migrar usuários existentes, evite recriar as mesmas contas no destino com outro UID. Se o e-mail já existir com UID diferente, a ferramenta interrompe antes de importar.
4. Gere uma conta de serviço no projeto de origem e outra no destino, com as permissões necessárias para ler/importar Authentication e ler/gravar Firestore. A leitura dos hashes das senhas requer permissão adicional de Authentication para consultar a configuração de hash. Use a conta proprietária dos projetos para configurar essas permissões.
5. Salve as credenciais somente no seu computador, nos caminhos abaixo. Esses nomes já estão excluídos do Git:

```text
b2-backend/firebase-service-account.origem.json
b2-backend/firebase-service-account.destino.json
```

Não cole essas credenciais em `src/firebase.js`, não envie ao GitHub e não coloque no frontend ou na Vercel. A configuração web que começa com `apiKey` não substitui uma conta de serviço administrativa.

## Preservar senhas

No console do **projeto de origem**, abra Authentication → Usuários → menu de três pontos → parâmetros de hash de senha. Crie a pasta `.secrets` e salve `.secrets/firebase-auth-hash.json` com os valores exatos desse projeto:

```json
{
  "key": "VALOR_BASE64_DO_BASE64_SIGNER_KEY",
  "saltSeparator": "VALOR_BASE64_DO_BASE64_SALT_SEPARATOR",
  "rounds": 8,
  "memCost": 14
}
```

Os números acima são apenas um exemplo: use os valores exibidos no seu projeto. A pasta `.secrets` está excluída do Git e da publicação. A ferramenta exige essa configuração para contas novas no destino que usam e-mail/senha. Ela verifica se os hashes estão disponíveis antes de executar a cópia; não funciona só com a configuração web pública.

## Planejar, sem gravar

Na pasta principal:

```powershell
npm run api:setup
node b2-backend/migrate-to-unified.mjs --source-sa b2-backend/firebase-service-account.origem.json --target-sa b2-backend/firebase-service-account.destino.json
```

Sem `--apply`, a ferramenta consulta os projetos, verifica conflitos de conta e mostra quantas contas/músicas serão planejadas. Não importa contas, não grava documentos e não envia áudios. Essa consulta consome leituras e requer acesso aos serviços reais. Confira se a origem e o destino estão corretos. O destino é validado como `repertorio-cd75a`.

## Executar a migração

Confira primeiro a configuração R2 existente em `b2-backend/.env.r2-v2`, incluindo a URL pública. Depois execute:

```powershell
node b2-backend/migrate-to-unified.mjs --source-sa b2-backend/firebase-service-account.origem.json --target-sa b2-backend/firebase-service-account.destino.json --hash-config .secrets/firebase-auth-hash.json --apply
```

A ferramenta:

1. Importa as contas que ainda não existem, mantendo UID e dados de autenticação. Contas já existentes com o mesmo UID e e-mail são preservadas.
2. Lê `musicas` e `musicasV2` da origem. As faixas V2 mantêm seus IDs. Um ID antigo que colida com uma faixa V2 recebe um ID `legacy-...` estável.
3. Confirma se o objeto já existe no R2. Se necessário, copia o áudio da URL de origem para `musicas-v2/`. Só cria o documento no catálogo novo depois de confirmar o objeto no R2.
4. Copia os perfis que ainda não existem, conservando assinaturas/papel e convertendo favoritos para os IDs unificados. Remove o campo legado `password`.
5. Copia `Chaves`, `accessKeys` e `keyRedemptions` e reúne os cadastros de cantores/estilos. Documentos existentes no destino são preservados.
6. Grava `b2-backend/migration-report.json` com resumo e músicas pendentes. Esse relatório também está excluído do Git.

Se uma música falhar, a ferramenta registra a pendência e tenta as demais. Ela não cadastra uma URL B2 como se fosse R2. Execute novamente para retomar: arquivos R2 existentes são reaproveitados e documentos já criados são preservados. A importação de contas interrompe em caso de erro; as importadas antes do erro permanecem no destino.

Documentos existentes no destino não são mesclados automaticamente. Se você já fez uma migração parcial ou possui favoritos novos, confira os perfis antes de publicar. A ferramenta cobre as coleções usadas por esta versão; não copia subcoleções ou coleções adicionais fora dessa lista. Métodos de login além de e-mail/senha também precisam ter seus provedores configurados no destino.

## Conferir antes de publicar

Entre com uma conta antiga no site local atualizado. Confira assinatura, papel admin, favoritos e chaves. Ouça e baixe uma música que era do B2 e uma que já era do R2; confirme que ambas agora usam a URL pública do R2. Teste uma pasta completa e o salvamento offline.

A cópia usa armazenamento, tráfego e leituras/gravações dos seus planos. Nenhuma migração remota foi executada nesta entrega: as chaves administrativas dos dois projetos não foram fornecidas. O modelo de migração foi testado localmente com adaptadores simulados; valide o planejamento e uma amostra real antes de mover todo o acervo.

O cadastro/login fica em um projeto Firebase e os áudios em um bucket R2. Não existe um segundo Firebase em uso nas páginas do site. O B2 só permanece como origem dos arquivos durante a migração; só retire o serviço antigo depois de conferir a cópia e a publicação.

Referências oficiais:

- https://firebase.google.com/docs/auth/admin/import-users
- https://firebase.google.com/docs/firestore/manage-data/move-data
- https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/
