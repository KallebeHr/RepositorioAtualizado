# Comece aqui — Firebase único e áudios no R2

Atualização de 13 de outubro de 2026. O site usa **repertorio-cd75a** para contas, perfis, assinaturas, chaves e catálogo. Todos os novos áudios são enviados ao R2 pela API local. O catálogo único fica em **musicasV2**, os cantores em **cantoresV2** e os estilos em **estilosV2**. O nome da coleção foi conservado para aproveitar os cadastros R2 existentes; as páginas antigas também consultam esse catálogo.

A configuração web nova já está aplicada em `src/firebase.js`. A troca não copia dados automaticamente. Para conservar contas, assinaturas e músicas do Firebase antigo, leia primeiro **MIGRACAO-FIREBASE-R2.md**. Nenhum dado remoto foi migrado ou apagado nesta entrega.

## Adicionais e aparelhos desta versão

Leia **ADICIONAIS-E-DISPOSITIVOS.md** antes de publicar. O equalizador agora pede código para contas comuns, com concessão protegida no Firebase. A administração acompanha dispositivos recentes e alerta acima de quatro. Instalação e offline mostram “Em breve” por padrão; a implementação anterior e os arquivos já salvos foram preservados. Publique também os novos índices de `firestore.indexes.json`.

## Verificação histórica do projeto real

Em 12/10/2026, a consulta pública ao catálogo novo retornou **403 — PERMISSION_DENIED**. Os domínios `localhost`, `repertorioatualizado.com.br` e `www.repertorioatualizado.com.br` já aparecem como autorizados no Authentication. Publique as regras incluídas no Firestore antes de colocar esta versão em uso. Essa consulta não confirmou a configuração de e-mail/senha nem leu contas de usuários.

## Novas funções de biblioteca

Esta versão inclui playlists pessoais, histórico com retomada, busca com tolerância a erros e filtros, central persistente de downloads, cantores seguidos e informações das pastas. Leia **NOVIDADES-BIBLIOTECA.md** para usar as seis funções. Atualize as dependências e publique novamente `firestore.rules` antes de publicar o site.

## 1. Preparar o Firebase novo

1. No console, abra o projeto **repertorio-cd75a**. Ative Authentication com **E-mail/senha**.
2. Em Authentication → Configurações → Domínios autorizados, inclua `localhost`, `repertorioatualizado.com.br` e `www.repertorioatualizado.com.br`. Os campos recebem o domínio, sem protocolo, porta ou caminho.
3. Crie o Cloud Firestore, banco `(default)`, se ainda não existir. Publique o arquivo completo `firestore.rules`. Não use uma regra que permite toda escrita pública.
4. Crie os índices de `firestore.indexes.json`. Pelo terminal, após autenticar na sua conta:

```powershell
npx firebase-tools login
npx firebase-tools deploy --only "firestore:rules,firestore:indexes" --project repertorio-cd75a
```

Espere os índices ficarem prontos antes de usar filtros que combinam estilo e data.

## 2. Dar acesso ao administrador

Para começar sem migrar contas: cadastre sua conta pelo site, abra Authentication e copie seu UID. No Firestore, abra `users/SEU_UID` e, usando o console da conta proprietária do projeto, defina `role` como texto `admin`, `subscription` como texto `ativa` e `subscriptionLifetime` como booleano `true`. Atualize o site. A migração também pode trazer o papel admin do perfil antigo, quando o perfil ainda não existe no destino.

A senha fica somente no Authentication. Não crie campo `password` no perfil. Após mudar o projeto Firebase, entre novamente com seu e-mail e senha no aplicativo atualizado. Após a futura liberação do offline, abra a versão nova com internet pelo menos uma vez antes de ficar sem conexão.

## 3. Instalar e iniciar localmente

Abra a pasta principal no VS Code. Execute uma vez:

```powershell
npm ci
npm run api:setup
```

No primeiro terminal:

```powershell
npm run api
```

No segundo terminal:

```powershell
npm run dev
```

Abra `http://localhost:3000`. O envio usa **localhost:3004**, no mesmo computador em que a API está ativa. `npm run api:v2` continua disponível como outro nome para o mesmo servidor R2. Os componentes antigos de envio agora usam esse fluxo também. Pare a API antiga da porta 3001, se estiver aberta.

O R2 usa a configuração privada de `b2-backend/.env.r2-v2`. Confira o botão **Verificar API R2 local** na administração. Essa verificação confirma a configuração; um envio pequeno confirma a permissão real no bucket. A chave de conta de serviço Firebase não é necessária para o envio normal; ela só é necessária para a migração opcional.

O aviso “Em breve” é o padrão desta entrega. Para testar a implementação preservada de instalação e offline, habilite as flags conforme **ADICIONAIS-E-DISPOSITIVOS.md** e gere o build de produção:

```powershell
npm run app:local
```

Para os celulares, use o domínio oficial por **HTTPS** após publicar. Um endereço de rede local HTTP pode abrir o site, mas não habilita todos os recursos da PWA.

## 4. Usar as pastas

- **Ouvir pasta:** inicia as músicas da pasta no player global. Navegar entre páginas não interrompe a faixa.
- **Adicionar pasta à fila:** acrescenta apenas as músicas que ainda não estão na fila.
- **Baixar pasta (.zip):** baixa um pacote com nomes numerados, evitando que duas faixas com o mesmo nome se sobrescrevam. Se um arquivo falhar, a Central oferece um ZIP identificado como parcial, com as faixas concluídas e `LEIA-ME-PENDENCIAS.txt`.
- **Salvar pasta offline:** guarda os áudios dentro do aplicativo. Mostra progresso e pendências; repetir aproveita os arquivos já salvos.
- **Pausar:** preserva arquivos concluídos e permite retomar pendências pela Central de downloads. Trocar de página não cancela a tarefa; após recarga ela aguarda sua escolha de retomar.
- **Somente salvas no aparelho:** organiza apenas as músicas offline. Sem internet, essa biblioteca é usada automaticamente.
- **Continuar pela pasta:** ao terminar a fila, o player carrega a pasta da última faixa e toca a música seguinte na ordem dos títulos. Para uma faixa avulsa, a pasta corresponde ao estilo principal e ao cantor. Se você iniciou uma pasta de estilo ou de cantor completo, esse contexto é mantido. Desative a opção para parar ao fim da fila; ela também está na janela Fila.

Os links de pastas conservam estilo/cantor na URL. A busca aceita acentos ou texto sem acento. No canto de uma faixa salva aparece **Salva offline**. A biblioteca offline depende da assinatura válida e do espaço disponível no aparelho.

Por proteção da memória, cada ZIP gerado no navegador tem limite de 350 MB. Pastas maiores podem ser salvas offline ou divididas em downloads menores. Esse limite não altera as chaves de acesso nem o número de músicas que você pode ouvir.

## 5. Publicar no domínio

```powershell
npm run build
```

Envie os arquivos ao seu repositório GitHub e deixe a Vercel gerar o deploy. Confira a reprodução e o download no domínio principal e no domínio com `www`. Os ouvintes acessam Firebase/R2 diretamente; a API local é usada apenas para o envio administrativo.

As chaves R2 e as contas de serviço permanecem fora do frontend. Não adicione arquivos privados ao Git. Confira os arquivos antes de sincronizar no VS Code. Depois da publicação, o aplicativo instalado pode oferecer **Atualizar app**; aplique a atualização quando terminar de ouvir.

As cotas do Firebase e do R2 continuam sendo as dos seus planos. Unificar o sistema não elimina essas cotas. As páginas de pastas reaproveitam o catálogo em memória por dois minutos, e os usuários administrativos continuam paginados.

## 6. Validar

```powershell
npm test
npm run test:rules
npx playwright-core install chromium
npm run test:browser
npm run build
```

O último comando restaura o build de produção depois dos testes com emuladores. Resultados e limites da validação estão em `STATUS-VALIDACAO.md`.
