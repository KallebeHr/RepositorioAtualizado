# Instalação no celular e volume no iPhone

Esta atualização mantém o mesmo Firebase, os dois catálogos, os envios B2/R2, as contas e a biblioteca offline. Ela altera a instalação do aplicativo e o controle de volume. As configurações dos backends permanecem iguais às da versão anterior.

## Instalar no Android

1. Abra **https://www.repertorioatualizado.com.br** no Chrome do aparelho, em uma aba normal.
2. Toque em **Instalar app**. Quando o Chrome oferecer a instalação, o convite abre nesse toque.
3. Se o convite não aparecer, use **⋮ → Adicionar à tela inicial → Instalar**, ou **⋮ → Instalar aplicativo**, conforme a versão do Chrome.
4. Abra o ícone criado na tela inicial. Entre na conta com internet e salve as músicas antes de ficar offline.

Se o link abriu dentro de Instagram, Facebook ou outro aplicativo, use o botão **Copiar endereço do aplicativo** e abra no Chrome. O navegador decide quando oferecer o convite nativo; o site também mostra o caminho pelo menu.

## Instalar no iPhone/iPad

1. Abra **https://www.repertorioatualizado.com.br** no Safari.
2. Toque em **Compartilhar**, o quadrado com seta para cima. Em alguns layouts, abra primeiro o menu **…**.
3. Role as opções e escolha **Adicionar à Tela de Início**.
4. Se aparecer **Abrir como App Web**, deixe ativado. Toque em **Adicionar**.
5. Abra o aplicativo pelo ícone da tela inicial, entre na conta e salve as músicas.

Se a opção estiver ausente, no final do menu Compartilhar use **Editar Ações** e adicione **Adicionar à Tela de Início**. O iOS não disponibiliza o evento de instalação automática usado pelo Chrome; por isso, o botão do site mostra estas instruções.

## Volume

Toque no nome da música para expandir o player no celular. O controle de volume aparece abaixo dos controles de reprodução, com a porcentagem. Ele também continua disponível no equalizador.

O iOS ignora alterações de `HTMLMediaElement.volume`. O controle desta versão ajusta o ganho na saída do mesmo grafo Web Audio do equalizador, sem recriar o áudio. Funciona com o equalizador ligado ou desligado, com música normal ou V2 e com a cópia offline. O volume é salvo por conta neste navegador.

Este é o volume da música dentro do aplicativo. O volume geral do aparelho continua sob controle dos botões físicos; deixe-o audível para conferir o ajuste do player.

## Aplicar no domínio

Guarde uma cópia da pasta atual. Extraia o ZIP atualizado em uma pasta nova. Se as configurações privadas B2/R2 foram alteradas por você depois da versão anterior, preserve as suas configurações locais.

Na pasta que contém `package.json`, execute:

```powershell
npm ci
npm run build
```

Atualize o código do seu repositório e publique pelo fluxo GitHub/Vercel que já utiliza. As alterações principais estão em `index.html`, `public/manifest.webmanifest`, `public/pwa-install-capture.js`, `src/services/pwa.js`, `src/utils/audio-volume.mjs`, `src/utils/pwa-platform.mjs`, `src/stores/usePlayerStore.js`, `src/components/AppInstall.vue`, `src/components/HeaderNav.vue` e `src/components/MusicPlayer.vue`.

O ZIP é um pacote para uso local e contém configurações privadas de backend. Não adicione o próprio ZIP, arquivos de conta de serviço ou arquivos privados de ambiente ao Git. O `.gitignore` inclui a exclusão desses arquivos; os exemplos de configuração continuam disponíveis.

Depois que a publicação terminar, abra o domínio com internet. Se aparecer **Atualizar app**, pause a música e toque nesse botão. Não limpe os dados do navegador: eles contêm as músicas salvas offline.

Esta entrega atualiza o arquivo do projeto; ela não publica automaticamente uma versão no domínio.

## Conferência

Consulte `STATUS-VALIDACAO.md` para os resultados executados. Os testes de interface usam Chromium com tamanhos e identificações de celular. A limitação de volume do iOS é simulada mantendo o volume HTML fixo em 1, e a alteração do sinal é medida no grafo de áudio. Isso não substitui um teste em Safari ou Chrome de um celular real.

No aparelho, confira instalação, abertura pelo ícone, música normal, V2, volume 0/50/100%, equalizador ligado/desligado e reabertura das músicas salvas sem internet. O botão de volume não altera a política do sistema para tela bloqueada ou suspensão do aplicativo.

Referências: [instalação de PWAs — MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [adicionar um site à tela inicial — Apple](https://support.apple.com/guide/iphone/bookmark-a-website-iph42ab2f3a7/ios), [restrição do volume HTML no iOS — Apple](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html).
