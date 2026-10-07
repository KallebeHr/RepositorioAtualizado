# Atualização completa do Repertório Atualizado

Esta versão usa o **mesmo Firebase `repertorio-d3552`**. Login e contas existentes continuam nele. Não configure `repertorio-cd75a`, não crie outra conta e não instale Firebase Admin para os envios.

## O que mudou

- Um player e uma mesa de som globais: a música continua ao navegar pelo menu, inclusive nas pastas, V2, favoritos e administração.
- Fila, volume e ajustes do equalizador ficam guardados por conta neste navegador. Ao reabrir, toque em reproduzir; o aplicativo respeita a autorização de áudio do navegador.
- Controles de reprodução do sistema via Media Session, quando o navegador oferece suporte.
- Aplicativo instalável e biblioteca `/Offline`: os áudios são salvos completos no aparelho, separados por conta. As listas carregam metadados sem trazer todos os áudios para a memória.
- Fontes incluídas no próprio site para abrir as páginas sem depender do Google Fonts.
- Admin com abas: os módulos são carregados quando você os abre. Usuários aparecem em páginas de até 25 contas, com total por contagem no servidor, pesquisa exata global por email, UID ou ID da conta e filtros da página.
- Excel e mensagens em massa preservados, com seleção entre página atual e toda a base. A consulta de toda a base só acontece após sua ação e confirmação.
- Novas chaves com quantidade limitada ou ilimitada de ativações e prazo em dias ou vitalício. Cada conta utiliza uma chave nova uma vez. A contagem é feita numa transação e protegida pelas regras.
- Importação das chaves antigas: preserva os códigos, com 30 dias e ativações ilimitadas; permite reutilizar a chave na conta quando o acesso expirar. Não apaga `Chaves` nem modifica assinaturas existentes.
- Cadastro deixa de salvar a senha no perfil. A senha e o login continuam no Firebase Auth. No admin, há uma ação para remover esse campo antigo dos perfis da página atual, sem alterar as senhas do Auth.

| Função | Catálogo normal | Catálogo V2 |
|---|---|---|
| Conta e assinatura | Firebase atual | A mesma conta |
| API de envio no computador | B2, porta 3001 | R2, porta 3004 |
| Cadastro no Firestore | `musicas` | `musicasV2` |
| Cantores/estilos | `cantores` / `estilos` | `cantoresV2` / `estilosV2` |
| Arquivo de áudio | B2 atual | R2, `musicas-v2/` |

## 1. Preparar a versão no computador

Guarde uma cópia da sua versão anterior e extraia o ZIP em uma pasta nova. Use **Node.js 22**. Abra o PowerShell na pasta que contém `package.json`:

```powershell
npm ci
npm run api:setup
```

As configurações B2 e R2 fornecidas foram preservadas nos arquivos do backend. Não copie suas chaves privadas para o frontend nem publique o diretório `b2-backend`. O Git e o envio à Vercel já excluem essas configurações.

Inicie a versão completa, com instalação e reabertura offline habilitadas:

```powershell
npm run app:local
```

Abra `http://localhost:3000`. Entre com seu login atual. Para administrar, seu documento `users/{UID}` precisa manter `role: "admin"` no Firebase atual.

A barra abaixo do menu mostra **Instalar app**, **Ouvir offline** e **Equalizador**, no computador e no celular. Ela acompanha as páginas. O botão de instalação abre uma tela com a opção nativa quando oferecida pelo navegador e instruções para as outras plataformas. **Salvar offline** aparece por escrito no V2, nas pastas, no carrossel normal e no player expandido.

Para editar o código com recarga de desenvolvimento, use `npm run dev -- --force --strictPort` depois de parar a versão completa. Os botões continuam visíveis, mas a instalação e a reabertura sem internet devem ser testadas com `npm run app:local`.

## 2. Preservar as chaves antigas e aplicar as regras

A regra antiga `allow read, write: if true` não protege usuários ou limites de chaves. Os limites só passam a ser exigidos pelo Firebase depois de publicar **`firestore.rules`**.

Siga esta ordem para manter os códigos existentes:

1. Na versão atualizada, abra **Admin → Chaves → Importar chaves antigas**.
2. Confira que os códigos antigos aparecem na nova lista. A importação não duplica os códigos em novas tentativas e não apaga a coleção anterior.
3. No Console Firebase, selecione **repertorio-d3552 → Firestore Database → Regras**.
4. Copie TODO o conteúdo de `firestore.rules`, substitua a regra atual e clique em **Publicar**. Este arquivo é completo, não um fragmento para acrescentar à regra pública.
5. Verifique login, catálogo normal, V2 e acesso ao admin com sua conta atual.

As regras incluídas foram testadas no emulador com envios normais e V2, perfis existentes, favoritos, chaves concorrentes, bloqueio de privilégio e renovação de códigos antigos. Elas cobrem as coleções usadas por esta versão. Se você tiver outros aplicativos externos escrevendo nesse Firebase, compare as coleções deles antes de publicar.

## 3. Usar os dois envios

Em outro terminal, na pasta principal:

```powershell
npm run api:v2
```

Para o envio normal, abra mais um terminal:

```powershell
npm run api
```

No admin, escolha **Músicas V2** ou **Envio normal**. Selecione arquivos, estilo e cantor e envie. No V2, o cadastro precisa chegar a **Publicada no Firebase**. O progresso do áudio em 100% sozinho não confirma a publicação.

O botão **Verificar API R2 local** verifica a configuração do servidor; não faz um upload real no bucket. Se o áudio subir e o Firebase falhar, repetir o envio V2 na mesma sessão usa o recibo existente, sem reenviar o áudio. As abas do admin preservam o formulário enquanto você navega entre elas.

Para testar com seus serviços, publique uma música pequena em cada formulário e confira os documentos em `musicas` e `musicasV2`, e os arquivos B2/R2. Nenhum upload foi realizado nos seus buckets durante a validação automatizada.

## 4. Instalar e ouvir offline

No site público em **HTTPS**, toque em **Instalar app**. No iPhone/iPad, use o Safari: **Compartilhar → Adicionar à Tela de Início**. Navegadores internos de WhatsApp/Instagram podem não oferecer instalação; abra no navegador do aparelho.

Entre na conta com internet e acesso ativo. Escolha uma música e toque no ícone de nuvem **Salvar offline**, no catálogo, nas pastas ou no player. Aguarde a confirmação. Abra **Offline** para conferir as músicas e ouvir todas, pesquisar ou liberar espaço.

Depois de preparar o aplicativo e salvar a música, desligue a internet e reabra o app. A biblioteca e os áudios salvos ficam disponíveis. O perfil salvo mantém a validade registrada da assinatura; ao conectar novamente, o Firebase atualiza o estado da conta.

Para testar instalação e reabertura offline no computador, pare o servidor de desenvolvimento e execute `npm run app:local`. Esse comando gera o build e abre a versão completa na porta 3000. O service worker fica ativo nesta versão; `npm run dev` serve para desenvolvimento. O navegador permite esses recursos em localhost; no site público, use HTTPS.

Os arquivos pertencem a esta conta, neste navegador e neste aparelho. A cópia não é enviada para outros dispositivos. Limpar os dados do navegador remove a biblioteca. O navegador pode remover dados locais se o aparelho ficar sem espaço; o aplicativo solicita armazenamento persistente quando disponível.

**Baixar** continua gerando o arquivo para sua pasta de downloads. **Salvar offline** prepara o áudio para reprodução dentro do aplicativo.

## 5. CORS dos áudios

Se aparecer `Access-Control-Allow-Origin` ausente ou `HTMLMediaElement already connected`, leia **`CORRIGIR-PLAYER-CORS.md`**. Ele explica como iniciar esta versão, remover um registro antigo do app e configurar o CORS do B2 com `npm run b2:cors:check` e `npm run b2:cors`, preservando as regras existentes.

O equalizador e o download offline precisam de acesso ao áudio com CORS, tanto no B2 quanto no R2. Na configuração do bucket R2, permita GET/HEAD para:

- `https://www.repertorioatualizado.com.br`
- `https://repertorioatualizado.com.br`, se você também usar esse endereço
- `http://localhost:3000` para testes

Exemplo de CORS do R2:

```json
[
  {
    "AllowedOrigins": ["https://www.repertorioatualizado.com.br", "https://repertorioatualizado.com.br", "http://localhost:3000"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["Content-Length", "Content-Range", "Accept-Ranges", "Content-Type", "ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Se você usar um domínio/CDN de mídia diferente, ele também precisa devolver os cabeçalhos corretos. Preserve a configuração B2 que já permite seus downloads e confira CORS nela caso o equalizador ou o salvamento offline falhem em músicas antigas. Depois de mudar CORS, aguarde a propagação e limpe o cache da CDN se ela guardar os cabeçalhos antigos.

## 6. Publicar

Gere a versão de produção:

```powershell
npm run build
```

Publique pelo procedimento que você já usa no seu projeto Vercel. As rotas e os cabeçalhos do aplicativo estão em `vercel.json`; o build gera o service worker. O backend de upload permanece no seu computador. O público utiliza as URLs dos áudios e o Firebase, sem precisar acessar a sua API local.

Se aparecer **Atualizar app**, pause a música e toque no botão. Atualizações não recarregam o aplicativo durante a reprodução.

## 7. Repetir os testes

```powershell
npm test
npm run test:rules
```

O segundo comando requer Java 17 ou superior para o emulador configurado. Para testes no navegador, instale o navegador de testes e execute:

```powershell
npx playwright-core install chromium
npm run test:browser
npm run build
```

Os testes de navegador usam apenas `demo-repertorio` nos emuladores locais. O último comando restaura o `dist` de produção depois do build de teste. A configuração de produção do seu Firebase não foi trocada.

## Comportamento e limites práticos

A reprodução continua ao trocar de página pelo menu do aplicativo. Recarregar o navegador, fechar o aplicativo, encerrar a aba ou o sistema operacional suspender/encerrar o processo pode interromper o áudio; reabra e toque em reproduzir. Controles na tela bloqueada e reprodução em segundo plano dependem do navegador e do sistema do aparelho.

Chaves ilimitadas não aumentam a cota do Firebase: normal, V2 e usuários continuam compartilhando o mesmo projeto. Áudios públicos não são DRM; as chaves controlam o acesso oferecido pelo aplicativo.

Leia `STATUS-VALIDACAO.md` para conferir o que foi realmente testado e o que depende dos seus serviços e aparelho.

`REVISAO-DAS-TELAS.md` reúne as capturas conferidas da barra, instalação, V2, player e equalizador no celular. `CORRIGIR-PLAYER-CORS.md` contém a correção do bloqueio de áudio observado no B2.
