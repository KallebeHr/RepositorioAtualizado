# Validação — biblioteca atualizada em 12 de outubro de 2026

## Resultado desta revisão

**70 testes de lógica/integração e 41 fluxos completos no Chromium aprovados nesta correção.** Os 41 fluxos passaram juntos, sem erros de JavaScript. Incluem os 39 fluxos anteriores e duas verificações adicionais de arraste na biblioteca e na fila. As regras não foram alteradas; os 13 testes de regras aprovados na revisão anterior continuam como referência dessa mesma configuração.

O build final foi gerado em modo de produção depois de remover a saída dos testes. Há avisos de tamanho do bundle e imports já existentes, que não impediram a compilação.

## Correção do arrastar e soltar

- A fila do player agora permite ordenar por mouse e toque; antes era uma lista fixa. As alças também aceitam ↑/↓ pelo teclado.
- A música que está tocando conserva identidade, posição e reprodução durante a mudança de ordem. O teste confirmou nenhum novo evento de reprodução e apenas uma conexão Web Audio.
- A ordem e o índice da faixa atual são restaurados após recarga, com o player pausado.
- Playlists usam listas estáveis durante o gesto e arraste compatível com toque, sem exigir pressão longa. A prévia do arraste aparece acima dos diálogos.
- Foi testado toque em viewport de celular: reordenação, movimentação entre as duas playlists em ambos os sentidos, rolagem durante o gesto e recarga com os IDs preservados.
- Os quatro novos testes de lógica verificam preservação da faixa atual, deslocamento de outra música, fila pausada/restaurada e recusa de ordenações inválidas.
- Os gestos de toque foram simulados pelo Chromium; esta revisão não foi executada em aparelhos Android/iOS físicos.

## Seis melhorias verificadas

1. **Playlists:** criar pelo catálogo, adicionar faixas, subir/descer, arrastar para reordenar, mover para outra playlist, conservar ordem/IDs no Firebase e recuperar após recarga. O movimento entre listas usa um lote atômico. Há caminhos com teclado e controles em 320 pixels.
2. **Histórico:** salvar o ponto, recarregar sem autoplay, retomar a posição escolhida, ouvir do início, habilitar a sincronização e conferir a gravação no Firestore emulado. O áudio e o grafo continuam únicos.
3. **Busca:** erro de digitação, acentos e filtros combinados de cantor, estilo, mês e duração. As faixas sem duração são excluídas do filtro de minutos. O mês considera São Paulo.
4. **Downloads:** iniciar pela pasta, navegar com o trabalho ativo, pausar durante o segundo arquivo, recarregar, retomar e conservar os arquivos concluídos. ZIP parcial identificado, relatório de falhas, nova tentativa sem repetir o arquivo concluído e remoção dos temporários do ZIP. Os áudios offline permanecem separados.
5. **Cantores seguidos:** seguir um artista, publicar uma faixa no emulador, atualizar novidades, recuperar a preferência após recarga, marcar como vista e mostrar o repertório completo.
6. **Informações das pastas:** contagem, soma de duração/tamanho e indicação dos dados ausentes. A API de upload foi exercitada com WAV válido: duração, bitrate e tamanho extraídos e repassados ao cadastro.

## Preservação das funções anteriores

Os fluxos existentes incluem login/cadastro/assinatura, chaves limitadas e ilimitadas, administração paginada, busca de usuários, Excel, mensagens e envio único R2. A resposta do R2 no teste de browser foi simulada; os documentos foram efetivamente gravados nos emuladores Firebase.

Player, fila, favoritos, downloads individuais, ZIP da fila, temporizador, equalizador, mudança de página, continuidade pela pasta da última faixa e salvamento/escuta offline continuam cobertos. Somente um elemento de áudio e um MediaElementSource são criados. O volume foi medido com volume HTML imutável para simular a restrição do iOS.

Instalação e instruções Android/iOS, evento de instalação antecipado, controle por teclado, redução de movimento, títulos longos, oito tamanhos de tela de 320 a 1920 pixels e celular na horizontal continuam cobertos.

## Persistência, permissões e isolamento

- Playlists, preferências e histórico sincronizado só podem ser lidos/escritos pelo dono habilitado, inclusive perante outro usuário ou administrador. Escritas inválidas e contas desativadas são recusadas.
- A troca de conta no mesmo navegador foi testada: não copia fila, histórico, playlists ou tarefas de download, e encerra o áudio anterior.
- IndexedDB migra das versões 1 e 2 para 3 sem apagar áudios/perfis anteriores. Tarefas e blobs temporários são separados por projeto/conta/tarefa.
- Playlist offline, histórico, cache do catálogo, autenticação/perfil guardados e recarga da PWA sem internet foram exercitados.
- O service worker guarda somente a aplicação e seus assets; áudios e downloads seguem direto para a rede e os arquivos offline são administrados pelo IndexedDB.

## Conferência da produção

O build contém o projeto **repertorio-cd75a**. Não contém o Firebase anterior, projeto/chave/endpoints dos emuladores nem a API antiga na porta 3001. Os **74 arquivos do precache** existem. Os valores privados de configuração examinados não aparecem no build público.

As duas configurações privadas do backend foram comparadas com a versão-base e conservadas byte a byte. Dependências do frontend/backend foram instaladas; as novas bibliotecas são `fuse.js` e `music-metadata`. `vuedraggable` já existia e foi reaproveitado.

As capturas novas de diagnóstico ficaram apenas na validação local. As imagens já presentes no ZIP de origem foram preservadas como referências da versão anterior, sem substituição pelas capturas deste teste.

## Serviços reais e passos de publicação

Esta revisão não publicou regras, não alterou contas/documentos de produção, não enviou áudios ao R2 real, não fez migração e não publicou deploy Vercel.

Na revisão da versão-base foram conferidos a resposta `/health` da API R2 e os domínios autorizados do Authentication. A consulta pública do catálogo então retornou 403. Esses resultados são históricos; não constituem um novo teste de produção desta revisão.

**Publique o arquivo completo `firestore.rules` no projeto `repertorio-cd75a`** antes de usar a sincronização das novas funções no domínio. Atualize dependências com `npm ci` e `npm run api:setup`, gere o build e publique pela Vercel. O envio administrativo continua local na porta 3004; ouvintes acessam Firebase/R2 diretamente.

## Limites verificados e limites do teste

ZIP no navegador tem limite de 350 MB; pastas maiores podem ser salvas offline ou divididas. Arquivos concluídos são recuperáveis após pausa; o arquivo interrompido recomeça inteiro. Suspensão do navegador, fechamento do aplicativo ou bloqueio da tela pode pausar downloads/reprodução. A tarefa é recuperada pausada ao reabrir.

Faixas antigas sem metadados não receberam duração estimada ou inventada. A interface informa os dados ausentes; os novos envios calculam duração quando o formato permite.

O histórico é local por padrão, com sincronização opcional para reduzir escritas no Firebase. Playlists e cantores seguidos sincronizam ao recuperar a conexão; outra tela/aparelho carrega a versão sincronizada ao abrir/recarregar a biblioteca.

Os testes usaram Chromium em Linux e emuladores Firebase. Não houve teste em iPhone/Android físicos; instalação, controles da tela bloqueada e segundo plano devem ser confirmados nesses aparelhos após publicar por HTTPS. Não é uma garantia de ausência de falhas em todos os dispositivos ou de funcionamento com regras ainda não publicadas.

## Repetir

```powershell
npm ci
npm run api:setup
npm test
npm run test:rules
npx playwright-core install chromium
npm run test:browser
npm run build
```

O último comando restaura a saída de produção após o build dos testes com emuladores. O uso das seis funções está descrito em `NOVIDADES-BIBLIOTECA.md`.
