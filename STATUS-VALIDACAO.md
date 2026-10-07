# Validação — 6 de outubro de 2026

## Resultado

54 testes e fluxos locais aprovados: 27 testes unitários/de integração, 10 testes de regras no emulador Firestore e 17 fluxos no Chromium. Após o relato de CORS e dos botões difíceis de encontrar, os 27 testes e os 17 fluxos foram executados novamente com as correções; as regras não foram alteradas desde a execução aprovada dos 10 testes. Instalações limpas do frontend e backend por `npm ci` e build de produção aprovados. O build informa avisos de tamanho de bundles, sem impedir a geração.

## Cobertura

- Player persistente entre Músicas V2, músicas normais, pastas e outras páginas; uma única fonte de áudio, avanço de faixa sem duplicação, volume e equalizador preservados.
- Pastas com filtros de cantor/estilo e fila correspondente à pasta.
- Áudio real de teste no navegador, salvamento em IndexedDB, separação por conta/coleção, migração de dados antigos e reprodução de Blob sem rede.
- Manifesto e service worker de produção, reabertura da biblioteca sem internet, fontes/ícones locais e perfil offline com validade da assinatura.
- Favoritos, download individual, ZIP da fila, notificações, repertórios e tutoriais.
- Login, cadastro com e-mail normalizado e ativação de chave com transação Firestore.
- Admin sem leitura inicial de todos os usuários, paginação e busca exata; Excel, mensagens em massa e alteração de assinatura.
- Formulários normal e V2 com gravação real nos emuladores; respostas das APIs de armazenamento simuladas no teste de navegador.
- Regras: propriedade do perfil, bloqueio de promoção a admin/assinatura indevida, uso limitado concorrente, uso ilimitado/vitalício, chave desativada, importação e renovação de chaves antigas.
- Transporte local V2 com armazenamento simulado: limites, origem, extensão, erro R2, ordem de upload/cadastro e retomada depois de erro Firebase.
- Carrossel normal: tocar, adicionar à fila e baixar; um servidor de áudio de outra origem sem CORS reproduz o bloqueio real do navegador. A mensagem de erro aparece e uma faixa válida volta a tocar sem criar outra fonte Web Audio. O download bloqueado não gera rejeição sem tratamento.
- Configuração B2: consulta sem escrita, preservação das regras existentes, aplicação somente de CORS com backup/revisão e bloqueio de permissão insuficiente/conflito.
- Barra com Instalar app, Ouvir offline e Equalizador: visibilidade, área de toque e acesso no computador e no celular. Tela de instalação, evento de convite nativo simulado e instruções de Safari com identificação iOS simulada no Chromium.
- Player expandido no celular: Salvar offline identificado, equalizador acima do player, fechar ambos e continuar reproduzindo com a mesma fonte de áudio. Capturas conferidas em `REVISAO-DAS-TELAS.md`.

As APIs locais normal e V2 iniciaram com as configurações fornecidas. A API normal respondeu HTTP 200 e `/health` da V2 respondeu HTTP 200, `storage: R2`, `testMode: false` e prefixo `musicas-v2`. Health confirma configuração local, não a permissão do token no bucket.

## Compatibilidade preservada

O bloco de configuração de produção continua idêntico ao projeto original: **repertorio-d3552**. O componente de envio normal, servidor B2, servidor/uploader R2 e arquivos privados de configuração dos backends foram comparados com a base e permaneceram idênticos. O comando `npm run api` foi ajustado para carregar a configuração no diretório correto do backend.

O build público foi verificado: sem credenciais privadas B2/R2 e sem configuração dos emuladores. Todos os 66 arquivos do precache existem. Os arquivos de configuração privados permanecem somente no backend e estão excluídos da publicação Vercel.

## Validação que depende dos serviços e do aparelho

Nenhum upload foi feito nos buckets reais, nenhuma conta/documento foi alterado no Firebase de produção e nenhuma regra ou versão do site foi publicada. Firebase Auth/Firestore foram testados com emuladores, e o armazenamento remoto com adaptadores simulados. Faça um envio pequeno em cada formulário e confira reprodução, download e CORS dos áudios reais conforme o guia.

Na investigação do erro informado, o MP3 real do B2 respondeu HTTP 206 com `Content-Type: audio/mpeg`, mas sem `Access-Control-Allow-Origin` para localhost. A consulta autenticada da configuração B2 retornou HTTP 502; nenhuma configuração remota foi alterada. Use os comandos de `CORRIGIR-PLAYER-CORS.md` no computador com acesso ao serviço. O arquivo do player no ZIP foi conferido: não instancia Howler e contém apenas uma criação de MediaElementSource.

Os testes de navegador usaram Chromium em Linux, com tamanhos de computador/celular. O convite nativo de instalação e o evento de conclusão foram simulados para validar o código; a tela iOS usou identificação de navegador simulada, sem Safari real. Instalação no sistema do aparelho, tela bloqueada e execução em segundo plano precisam ser conferidas nos celulares usados pelo público. Navegação interna preserva a reprodução; fechar/recarregar o app ou o sistema encerrar o processo pode interrompê-la.

Para aplicar as regras, entre como admin na versão atualizada, importe as chaves antigas e publique o arquivo completo `firestore.rules` no mesmo Firebase, conforme `COMECE-AQUI.md`. A regra antiga que permite tudo não foi mantida como recomendação.

## Comandos

```powershell
npm test
npm run test:rules
npx playwright-core install chromium
npm run test:browser
npm run build
```

O último build restaura a versão de produção após o teste de navegador. As dependências e os testes seguem incluídos no projeto; não é necessário enviar `node_modules`.
