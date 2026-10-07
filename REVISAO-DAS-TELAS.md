# Revisão dos controles e das telas

As capturas abaixo foram feitas nesta revisão, com dados fictícios nos emuladores. A base visual do site foi preservada. A prioridade foi tornar as funções solicitadas fáceis de encontrar e acessíveis durante a navegação.

## 1. Computador — aprovado

Instalar app, Ouvir offline e Equalizador aparecem logo abaixo do menu, com texto. A barra acompanha a página ao rolar. Antes, instalação/offline eram atalhos pequenos sobre o conteúdo.

![Barra de controles no computador](tests/ui-desktop.png)

## 2. Celular — aprovado

Os três controles aparecem por escrito em uma linha de botões. A validação conferiu limites da tela, altura mínima de toque e se cada botão podia receber o clique sem ser coberto. Atalhos flutuantes que cobriam ações foram retirados; suporte continua no menu e junto ao rodapé.

![Barra de controles no celular](tests/ui-mobile.png)

## 3. Instalação — fluxo da interface aprovado

O botão abre uma tela com instruções e aciona o convite nativo no primeiro toque quando o navegador o oferece. A oferta também é conservada quando chega antes do carregamento do aplicativo. O código foi validado com eventos de instalação simulados, inclusive o evento de conclusão durante o convite. A instalação real no sistema do aparelho depende do navegador e precisa ser conferida no dispositivo.

![Tela de instalação no celular](tests/ui-install-mobile.png)

## 4. iPhone/iPad — instruções aprovadas

A interface orienta Safari → Compartilhar → Adicionar à Tela de Início. Essa captura foi feita no Chromium com identificação iOS simulada; não representa um teste em Safari real.

![Instruções para iPhone](tests/ui-install-ios.png)

## 5. Músicas V2 — aprovado

Ouvir, Adicionar à fila, Salvar offline e Baixar arquivo têm texto. O teste salvou a faixa pelo botão do catálogo e depois reproduziu a cópia sem internet. O estado “App instalado” nesta captura foi produzido pelo evento simulado do teste.

![Ações do catálogo V2 no celular](tests/ui-v2-mobile.png)

## 6. Biblioteca offline — aprovado

A biblioteca vazia explica como preparar os áudios e oferece acesso aos dois catálogos. Com músicas salvas, mostra as faixas da conta, espaço utilizado, busca, fila e remoção. O teste reabriu a página sem rede e reproduziu faixas normais e V2 por Blob local.

![Orientação da biblioteca offline](tests/ui-offline-empty-mobile.png)

## 7. Player no celular — aprovado

Ao expandir o player, a ação offline tem legenda, o equalizador continua acessível e o controle de volume aparece com porcentagem. Fechar o player volta à navegação sem parar a música.

![Player expandido no celular](tests/ui-player-mobile.png)

## 8. Equalizador — aprovado

A mesa abre acima do player expandido e mantém os ajustes ao trocar de rota. A validação conferiu uma única fonte Web Audio durante todos esses caminhos. Os controles também funcionam com as cópias salvas offline.

![Equalizador no celular](tests/ui-equalizer-mobile.png)

## 9. Android — instruções aprovadas

O Chrome tem um caminho pelo menu quando o convite nativo não aparece. O endereço pode ser copiado para sair de navegadores internos de outros aplicativos. A interface foi testada com identificação Android simulada no Chromium.

![Instruções para Android](tests/ui-install-android.png)

## 10. Volume no player do celular — aprovado em simulação

O volume fica abaixo dos controles, com porcentagem. A captura mostra 20%. O teste manteve a propriedade HTML de volume em 1 e mediu a redução do sinal na saída Web Audio; também verificou silêncio com EQ desligado e restauração offline. Safari/iOS real ainda depende de conferência no aparelho.

![Volume no player com identificação iOS simulada](tests/ui-volume-ios.png)

## 11. Novo visual do player global

A barra do computador usa controles identificados e progresso preenchido. No celular, a tela expandida agrupa a capa, a identificação, o transporte e as ações; volume e temporizador ficam visíveis. A disposição na horizontal coloca a capa ao lado dos controles. As capturas usam dados fictícios no Chromium.

![Barra do player no computador](tests/player-design-desktop.png)

![Player expandido no celular](tests/player-design-mobile.png)

![Celular com largura de 320 pixels](tests/player-design-small.png)

![Celular na horizontal](tests/player-design-landscape.png)

![Título longo com controles preservados](tests/player-design-long-title.png)

![Fila de reprodução](tests/player-design-queue.png)

![Temporizador](tests/player-design-timer.png)

## Limites da conferência

Capturas e testes de interação não comprovam conformidade completa de acessibilidade. Foram conferidos os controles principais, nomes acessíveis, visibilidade e áreas de toque. Safari real, Android/iOS em aparelho, instalação no sistema, tela bloqueada e política de suspensão do áudio dependem da validação nos dispositivos.

O áudio B2 informado respondeu sem CORS para localhost; essa configuração remota não pôde ser alterada nesta execução. A correção no computador está em `CORRIGIR-PLAYER-CORS.md`. As configurações de armazenamento não são solucionadas apenas pelo layout do site.
