# Novo player global

O componente visual fica em **`src/components/MusicPlayer.vue`**. Ele é montado uma vez em `src/App.vue`; a reprodução usa `src/stores/usePlayerStore.js`.

## Aplicar esta revisão

Nesta revisão de 12/10/2026, o player trabalha com o store e os serviços de pastas atualizados. Use o ZIP completo e siga `COMECE-AQUI.md`; trocar somente `MusicPlayer.vue` não instala a continuação por pasta nem a unificação do Firebase.

O arquivo visual continua em `src/components/MusicPlayer.vue`, a lógica em `src/stores/usePlayerStore.js` e a seleção de pastas em `src/services/catalog.js` e `src/utils/folders.mjs`. A janela Fila permite ativar/desativar a continuação e mostra qual pasta vem depois.

## Usar os controles

- **No computador:** barra flutuante com capa, identificação da faixa, anterior/reproduzir/próxima, progresso, ações e volume.
- **No celular:** toque no nome da música para expandir. O player se adapta a telas pequenas e reorganiza a capa e os controles na horizontal. A seta superior recolhe o player sem parar a música.
- **Baixar:** gera o arquivo de áudio na pasta de downloads.
- **Salvar offline:** guarda a música para ouvir dentro do aplicativo sem internet. Depois da confirmação, aparece **Salva offline**.
- **Equalizador:** abre a mesa de som global. Um ponto no botão indica que o equalizador está ativado.
- **Fila:** mostra a sequência, permite tocar uma faixa, favoritar, remover ou baixar o pacote.
- **Volume:** mostra a porcentagem. Toque no ícone para silenciar; toque novamente para restaurar o último volume audível.
- **Timer:** escolha 15, 30 ou 60 minutos para pausar a reprodução. O botão mostra os minutos restantes e permite desativar o temporizador.

As barras pequenas da capa indicam atividade de reprodução; elas são uma animação visual, não uma medição das frequências do áudio. A medição do som continua na mesa do equalizador.

## Detalhes do visual

O player usa tons escuros, verde claro, bordas arredondadas, iluminação suave na capa, progresso preenchido e transições na troca de música. As animações de atividade param ao pausar. A preferência **reduzir movimento** do sistema desativa os efeitos do player.

A capa continua usando `/LogoMusic.jpg`. Para personalizar a cor principal, procure `--accent` no estilo de `MusicPlayer.vue`. O layout do computador começa em `.player-container`; a tela expandida usa `.player-container.expanded`.

O componente utiliza os recursos Vue e Vuetify já presentes no projeto. A conta, o volume pelo ganho Web Audio, o equalizador, os downloads, a biblioteca offline e os dois envios continuam usando a estrutura atual. O player não cria outro elemento de áudio nem outra fonte Web Audio.

## Conferência

Os testes de interface incluem oito dimensões entre 320 e 1920 pixels, celular na horizontal, nomes longos, áreas de clique, volume, mute, teclado, fila e pausa pelo temporizador. A passagem do tempo foi acelerada no navegador para verificar o temporizador.

Capturas reais dos testes estão em `tests/player-design-*.png`, com nomes e músicas fictícios. O navegador usado é Chromium em Linux com dimensões de celular; isso não representa testes em aparelhos Android ou iOS físicos. O comportamento com tela bloqueada ou com o sistema suspendendo o aplicativo continua dependendo do aparelho.

A lista de resultados está em `STATUS-VALIDACAO.md`.
