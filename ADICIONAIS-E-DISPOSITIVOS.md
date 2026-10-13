# Equalizador por código, novidades e dispositivos

Versão de 13/10/2026. O Firebase continua sendo **repertorio-cd75a** e o envio de áudio continua usando a API R2 local. Não há Firebase novo, conta de serviço nova ou servidor público extra para estas funções.

## Publicar esta atualização

1. Faça uma cópia da sua pasta atual e substitua os arquivos do projeto pela versão desta entrega. Conserve os arquivos privados do R2 em `b2-backend/`.
2. Na pasta principal, execute `npm ci`. A atualização não introduz bibliotecas novas.
3. **Publique o arquivo completo `firestore.rules` e os índices de `firestore.indexes.json` no projeto repertorio-cd75a antes do site.** As regras antigas não conhecem códigos do equalizador, aparelhos e alertas.

```powershell
npx firebase-tools login
npx firebase-tools deploy --only "firestore:rules,firestore:indexes" --project repertorio-cd75a
```

4. Espere os índices de dispositivos e de ativações do equalizador ficarem prontos. Enquanto um índice estiver criando, o módulo mostra uma mensagem em vez de uma contagem inventada.
5. Execute `npm run build` e publique pela sua integração atual com a Vercel. Para testar localmente, use `npm run dev`. O envio mantém `npm run api:setup` uma vez e `npm run api` em outro terminal.
6. Em aplicativos já instalados, use **Atualizar app** após pausar a reprodução. O botão de atualização foi preservado mesmo com novas instalações em espera.

No PowerShell com `npm.ps1` bloqueado, os equivalentes são `npm.cmd ci`, `npm.cmd run dev`, `npm.cmd run api:setup` e `npm.cmd run api`. Não é preciso modificar a política global do Windows.

Os arquivos privados de backend não entram no GitHub ou no build público. Mantenha as exclusões do `.gitignore` e da `.vercelignore`.

## Gerar e ativar o equalizador

1. Entre com uma conta que tenha `role: admin`, não desativada, no perfil do mesmo Firebase.
2. Abra **Administração → Equalizador**.
3. Escolha ativações limitadas ou ilimitadas e validade por dias ou vitalícia. O padrão é **uma conta, vitalício**.
4. Clique **Gerar código do equalizador**, copie e entregue ao usuário após confirmar a liberação pelo seu atendimento.
5. O usuário, com assinatura ativa, abre a mesa normalmente. Ao tentar ajustar uma banda, escolher uma predefinição ou ligar o processamento, aparece **Ative seu equalizador**.
6. O código é validado online. A liberação fica na conta e aparece nos demais aparelhos após receberem a atualização do Firebase. O código da assinatura de músicas continua separado.

Os perfis administradores com assinatura ativa podem usar a mesa para demonstração sem gastar código. Para conferir a cobrança por código, use uma conta comum.

A validação grava, em uma transação:

- `equalizerKeys/{hashDoCodigo}`: política, status e contador;
- `equalizerRedemptions/{hashDoCodigo_uid}`: conta e recibo de uso;
- `users/{uid}/addons/equalizer`: liberação, prazo e recibo correspondente.

As regras validam a assinatura ativa, os campos, os horários do servidor, a política e a correspondência dos três documentos. Limite, recibo e concessão não podem ser gravados isoladamente pelo usuário. Cada conta usa cada código uma vez. Um **novo** código por dias amplia o prazo restante de uma concessão ativa; uma concessão vitalícia vigente não é reduzida por um código temporário.

**Desativar código** impede novos usos, conservando as liberações anteriores. **Consultar equalizador** por UID permite revogar ou reativar uma conta. A reativação conserva o vencimento anterior. **Ver ativações** mostra os recibos reais do código, paginados.

O player aplica o processamento somente com assinatura e concessão válida confirmada pelo servidor; um cache ou uma escrita local pendente não liberam o adicional. Sem liberação, as bandas ficam em bypass. O volume, a reprodução, a fila e a navegação continuam disponíveis. Revogação ou expiração retiram o processamento quando o aparelho recebe a mudança; expirações locais são conferidas a cada 15 segundos.

A confirmação inicial do adicional exige internet. Durante uma sessão já confirmada, a perda de conexão conserva a concessão em memória até o vencimento. Em uma recarga sem internet, não há nova confirmação do servidor: a mesa permanece em bypass até reconectar. O volume e os áudios já salvos continuam usando a implementação preservada quando o modo offline for liberado.

Esta liberação protege a concessão no Firebase. O áudio e o processamento executam no navegador: isso não impede uma pessoa de alterar manualmente seu próprio JavaScript ou usar outro equalizador. Não há DRM nem proteção nova das URLs públicas do R2 nesta atualização.

## Novidades, valores e atendimento

O banner **Novidades e adicionais** abre `/Novidades`, com equalizador por código, instalação, offline e videoclipes.

- Adicionais de áudio: **R$ 5 a mais por recurso**.
- Videoclipes: **R$ 20 pela liberação**, com disponibilidade em breve e consulta ao suporte.
- Pagamento, duração comercial e entrega são tratados pelo suporte. Esta versão não cobra automaticamente nem inventa uma periodicidade mensal.
- Os videoclipes são um anúncio: não foi criado catálogo, upload ou download de vídeos nesta tarefa.

O WhatsApp das novas telas usa `VITE_SUPPORT_WHATSAPP`, com o número já presente no botão comercial do site como padrão: `5586995102595`. Use somente DDI, DDD e número. Esta configuração é pública e não recebe tokens do R2.

Não foram criadas notificações de compradores fictícios. Para divulgar compras ou ativações, use registros verdadeiros e, quando houver nome ou imagem, autorização da pessoa. Os recibos administrativos do equalizador são reais e privados.

## Instalação e offline: aviso ativo, implementação preservada

Nesta entrega, os dois recursos começam **em espera**:

```env
VITE_INSTALL_RELEASED=false
VITE_OFFLINE_RELEASED=false
```

Os botões de instalação e escuta offline abrem **“Este recurso será liberado em breve”**, com opção de conversar com o suporte. Salvar faixas ou pastas offline também mostra o aviso, sem iniciar os arquivos. Retomar tarefas offline anteriores fica suspenso; as tarefas e os arquivos já salvos são conservados. Downloads individuais e ZIP continuam funcionando.

O código anterior está preservado em `src/services/pwa.js`, `src/services/offline.js`, `src/services/downloads.js`, `src/stores/useDownloadStore.js`, `src/pages/Offline.vue` e `scripts/build-pwa.mjs`. A política dos botões fica em `src/services/feature-release.js` e o aviso em `src/components/FeatureNotice.vue`.

Para liberar depois, defina o recurso correspondente como `true` em `.env.local` no seu computador e nas variáveis do projeto Vercel para o ambiente desejado. Gere e publique **um novo build**. A edição da variável não muda um build já publicado.

O service worker, os ícones, o manifesto e a atualização do app permanecem. O aviso controla as entradas do sistema; não impede a instalação manual oferecida pelo navegador, nem retira arquivos já baixados ou dados de versões antigas. Não há remoção de áudios existentes nesta tarefa.

`.env.e2e` habilita os recursos preservados para testar sua futura liberação. `.env.release-test` usa emuladores com os dois recursos em espera. Esses modos de teste nunca devem ser usados para publicar o site real.

## Aparelhos e alerta acima de quatro

Cada instalação de navegador recebe um identificador aleatório local. A mesma instalação, em várias abas, é contada uma vez. Navegadores diferentes, perfis diferentes, limpeza de dados e alguns aplicativos instalados podem criar registros distintos no mesmo aparelho físico.

O registro fica em `users/{uid}/devices/{id}` e contém tipo do aparelho, sistema, navegador, modo instalado, primeiro registro, último acesso e última atividade. Não são coletados IP, localização, senha, áudio ou impressão digital do hardware. Os horários de atividade são validados contra o relógio do Firestore.

Uma instalação é considerada **conectada recentemente** se não saiu da conta e teve atividade nos **últimos sete minutos**. A aplicação verifica o pulso a cada 30 segundos e limita a gravação normal a uma vez a cada **três minutos**, compartilhada entre abas. Uma aba oculta atualiza quando há música tocando; sem reprodução e oculta, aguarda voltar à tela. O botão Sair tenta marcar o registro como desconectado antes de encerrar o Firebase Auth.

Fechar o navegador, suspender o celular ou perder a rede não garante uma notificação imediata. O registro sai da contagem após a janela de atividade. “Conectado recentemente” não significa que há uma pessoa olhando a tela naquele segundo, nem corresponde à validade de todos os tokens de login.

Abra **Administração → Dispositivos e alertas**:

- Veja quantidade de instalações recentes e de contas com atividade.
- Filtre contas acima de quatro e pesquise os registros recentes.
- Clique **Ver aparelhos** ou abra um UID para consultar o histórico, paginado em 20 registros.
- Em **Usuários**, o botão **Aparelhos** abre o histórico daquela conta.
- Quando uma conta chega a **cinco ou mais** instalações recentes, surge o aviso no topo da administração e é registrado um alerta privado.
- **Marcar revisado** guarda horário e administrador. O alerta não bloqueia a conta.
- Durante o monitoramento, o alerta é encerrado quando a contagem volta a quatro ou menos. O histórico mostra os últimos 50 alertas por conta; um novo excesso reabre o registro.

O monitoramento administrativo e a gravação de alertas funcionam **enquanto a administração está aberta**. Não existe processo em segundo plano que envie alerta quando nenhum administrador está usando a página. Não foram adicionados bloqueio de aparelhos, revogação geral de sessões ou limite automático de reprodução.

O painel consulta somente registros de dispositivos na janela recente. Perfis são carregados por UID para as contas exibidas, e o histórico é aberto sob demanda. A lista de usuários conserva a paginação de 25 contas e a busca exata na base. Ainda há leituras e escritas cobradas pelo Firestore; a cadência espaçada reduz tráfego, mas não elimina consumo de cota.

As regras permitem ao usuário escrever somente registros da própria conta, com campos limitados e horário de atividade do servidor. Histórico de outras contas e todos os alertas ficam restritos ao administrador. A identidade local e os metadados são informados pelo cliente; este recurso auxilia a investigação de compartilhamento, sem certificar o número de pessoas ou aparelhos físicos.

## Verificação reproduzível

```powershell
npm test
npm run test:rules
npm run test:browser
npm run test:releases
```

Os testes das regras e navegador usam emuladores Firebase, exigem Java e um Chromium compatível com Playwright. A resposta do R2 em testes de upload é simulada; não são enviados arquivos reais para produção.

Depois de testes de browser, gere `npm run build` novamente para restaurar o build de produção, sem emuladores. Consulte `STATUS-VALIDACAO.md` para o resultado final desta entrega e os limites dos testes.
