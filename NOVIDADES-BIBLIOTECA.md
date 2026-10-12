# Playlists, histórico, busca e downloads

Esta versão mantém o Firebase único `repertorio-cd75a`, o catálogo `musicasV2`, os áudios no R2 e o envio administrativo pela API local. As novas áreas estão na barra **Playlists · Histórico · Downloads · Seguindo · Pastas**, logo abaixo dos controles de instalação/offline/equalizador, e também no menu lateral.

## Antes de publicar

1. Execute `npm ci` na pasta principal e `npm run api:setup` para atualizar as dependências do servidor local.
2. Publique o **arquivo completo** `firestore.rules` no mesmo projeto Firebase. As novas regras autorizam somente o dono a ler/escrever sua biblioteca. Não substitua por uma regra de acesso público.
3. Rode `npm run build` e publique pela Vercel. Aplique a atualização oferecida pelo aplicativo instalado quando terminar de ouvir.

```powershell
npx firebase-tools login
npx firebase-tools deploy --only "firestore:rules,firestore:indexes" --project repertorio-cd75a
```

As novas funções não criam outro Firebase e não dependem de uma conta de serviço para o uso normal. Não houve migração de dados remotos nesta atualização.

## 1. Playlists pessoais

- Use **Playlist** na música, **Adicionar pasta à playlist** nas pastas ou **Salvar fila em playlist** dentro da fila do player.
- Crie e renomeie listas em **Playlists**. Cada conta pode organizar até 100 listas, com até 500 faixas em cada uma. Uma música repetida é ignorada.
- Arraste pela alça para ordenar; abra outra playlist no painel de destino para mover entre listas. No celular, segure a alça antes de arrastar. Os botões **↑**, **↓** e **Mover** oferecem a mesma organização sem arrastar.
- Ouça uma playlist, salve suas faixas offline ou envie seu ZIP à central de downloads.
- As listas ficam no Firebase em `users/UID/playlists`. O cache e as pendências locais são separados por conta. Ao recuperar a conexão, alterações pendentes tentam sincronizar automaticamente. Outra tela/aparelho carrega a versão sincronizada ao abrir/recarregar a biblioteca.
- Uma faixa retirada do catálogo continua identificada como indisponível na playlist, para você decidir se deseja removê-la. Excluir uma lista não apaga áudios ou músicas salvas offline.

## 2. Histórico e retomada

- **Histórico** mostra as últimas 100 faixas e o ponto salvo aproximadamente a cada cinco segundos e ao pausar/trocar de música.
- **Continuar** retoma a posição escolhida; **Ouvir do início** reinicia a faixa. Músicas concluídas começam novamente. Recarregar a página não dispara reprodução automática.
- O histórico fica neste aparelho por padrão. Habilite **Sincronizar histórico entre aparelhos** se desejar salvá-lo em `users/UID/history`. A sincronização grava ao pausar/trocar de faixa, reduzindo escritas no Firebase.
- A fila restaurada pelo player também conserva o ponto. Fechar abruptamente o navegador pode perder os últimos segundos ainda não gravados.
- **Limpar histórico** limpa as entradas locais e solicita a remoção das entradas do Firebase. Sem internet, as exclusões das entradas conhecidas ficam pendentes; para remover também entradas remotas de outros aparelhos, limpe novamente quando conectado.

## 3. Busca inteligente

- **Todas as músicas** busca em todo o catálogo carregado, com tolerância a pequenos erros de digitação.
- Combine cantor, estilo, mês de publicação e duração mínima/máxima em minutos. O mês considera o fuso de São Paulo.
- Os filtros são executados no aparelho, sem consultas ao Firebase a cada letra. A tela mostra 50 resultados por vez; **Carregar mais músicas** revela outros resultados.
- A busca das pastas também aceita pequenos erros. **Atualizar** recarrega o catálogo e as novas publicações.
- Metadados de catálogo são guardados para consulta offline. Isso não baixa o áudio: para ouvir sem internet, use **Salvar offline**.

## 4. Central de downloads

- Inicie várias pastas/playslists e acompanhe em **Downloads**. O processamento continua ao navegar entre páginas; apenas um arquivo é processado de cada vez.
- **Pausar** preserva os arquivos concluídos. **Retomar** reaproveita esses arquivos e tenta os pendentes. Um arquivo interrompido é reiniciado por inteiro, sem retomada por bytes.
- Após fechar/recarregar o aplicativo, as tarefas em andamento voltam **pausadas**, para você decidir quando usar a conexão novamente. Desconexão, saída da conta ou assinatura expirada pausam o trabalho.
- A central mostra arquivos com falha. Um ZIP incompleto aparece explicitamente como **parcial**, com relatório de pendências; ele não é entregue automaticamente como um pacote completo.
- ZIPs concluídos ficam no armazenamento deste aparelho até remover a tarefa. **Baixar arquivo ZIP** permite baixar novamente, inclusive quando o navegador bloqueia o início automático.
- **Remover tarefa** libera os arquivos temporários do ZIP. Os áudios da biblioteca offline permanecem.
- A central também recebe o **Baixar tudo** da página Cantores. O download individual e o ZIP antigo da fila do player continuam disponíveis.
- ZIPs no navegador têm limite de 350 MB. Para pastas maiores, use offline ou divida a seleção. Espaço disponível e políticas do navegador também limitam o armazenamento.
- Trocar de página mantém o trabalho. Fechar o app, bloquear a tela ou suspender o navegador pode interrompê-lo; a recuperação das pendências ocorre ao reabrir. Arquivos salvos offline dependem do armazenamento do aparelho, que o navegador pode liberar.

## 5. Seguir cantores

- Use **Seguir cantor** no catálogo, em Cantores ou na área **Seguindo**.
- Publicações posteriores ao momento em que você começou a seguir aparecem como **NOVA**. Não cria notificações push e não baixa músicas automaticamente.
- **Atualizar novidades** consulta o catálogo; **Marcar novidades como vistas** atualiza o marco de leitura. Desmarque **Somente novidades** para ver todas as músicas dos cantores seguidos.
- Preferências ficam em `users/UID/musicSettings/main`, com limite de 100 cantores. Deixar de seguir e seguir novamente começa um novo marco de leitura.

## 6. Informações antes de baixar

- Pastas e playlists mostram quantidade de faixas, duração conhecida e tamanho conhecido.
- Se faltam dados, a interface mostra quantas músicas estão **sem duração** ou **sem tamanho**. Os totais conhecidos são parciais nesses casos.
- A API local extrai duração, bitrate e codec dos novos arquivos enviados. Os cadastros antigos não recebem esses campos automaticamente; sem uma leitura dos áudios existentes, não há como inventar uma duração confiável.

## Bibliotecas adicionadas

- `fuse.js`: busca com tolerância a erros, no frontend.
- `music-metadata`: leitura dos metadados no servidor de upload local.
- `vuedraggable`: já fazia parte do projeto; agora organiza e move as playlists.

O player continua usando um único elemento de áudio e um único grafo de equalização. Os controles de volume e o fluxo de instalação existentes foram preservados. Os testes automatizados simulam limitações do iOS; a confirmação em aparelho físico continua necessária.
