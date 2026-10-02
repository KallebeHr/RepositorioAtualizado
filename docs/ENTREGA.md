# Estado da entrega — 02/10/2026

## Implementado

Player global com navegação SPA, sequência automática por gênero, fila, temporizador, Media Session e equalizador centralizado. Biblioteca com playlists privadas, favoritos, filtros combinados, páginas individuais e recomendações locais. Conta com perfil, recuperação, validade, renovação e histórico. API autenticada com regras de assinatura, chaves únicas transacionais, R2/B2 S3, uploads diretos, progresso e repetição individual, hashes de duplicação, edição em lote, CSV, agendamento, verificação de arquivos, usuários, exportação Excel, avisos, auditoria, backup e recuperação com prévia. PWA e preferências de efeitos/economia de imagens. Checkout opcional com validação de webhook e pagamento. Utilitários para preparar pacotes, migrar B2, medir metadados e remover senhas antigas.

## Validação local

- 11 testes de regras de negócio e utilitários.
- 12 testes com Firestore emulado, incluindo uso concorrente de chaves e acesso indevido entre contas.
- 5 testes de navegador: filtros/mobile; player entre páginas e avanço por gênero; favoritos/playlists/perfil/rotas; painel/chaves/auditoria; temporizador/preferências.
- Compilação Vite de produção.
- Inspeção de capturas de tela de desktop e celular.

O áudio de teste é sintético e a resposta de autorização de mídia é simulada no teste de navegador. Os testes de conta e dados usam Authentication e Firestore emulados. Os testes não modificaram cadastros, assinaturas ou músicas reais.

## Homologação necessária

- Configurar as variáveis administrativas do Firebase e R2/B2 S3, aplicar regras e confirmar contas reais de teste.
- Validar um upload, a URL temporária e o download no armazenamento real, incluindo CORS e celulares.
- Ativar o processo externo de pacotes; sem ele os pedidos ficam pendentes. A workflow GitHub está preparada, mas depende de segredos e da branch padrão.
- Configurar e testar Mercado Pago antes de receber pagamentos.
- Medir metadados antigos e executar a migração/limpeza somente após backup e revisão.
- Conferir os domínios Firebase e a integração do repositório privado na Vercel.

## Limitações explícitas

Fechar completamente o navegador encerra o áudio. Segundo plano e tela bloqueada dependem do sistema e navegador. URLs B2 públicas antigas não se tornam privadas por checagens no frontend/API. O catálogo público revela metadados de músicas agendadas, embora os arquivos novos sejam bloqueados até a publicação. A busca atual carrega os metadados do catálogo completo, com paginação na tela; catálogos muito grandes precisam de busca/paginação no servidor. O painel usa até 1.000 registros por coleção e o volume de downloads é estimativa de solicitações, não consumo faturado. Pacotes têm limite de 200 faixas por seleção. Backups não incluem bytes de áudio nem usuários do Authentication. Estornos exigem conciliação administrativa. Preferências de gêneros são locais ao dispositivo.

O código de produção e o banco atuais devem permanecer preservados até a homologação. O guia completo está em CONFIGURACAO.md.
