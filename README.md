# Repertório Atualizado — versão 2

Vue 3 + Vuetify + Pinia, Firebase Authentication/Firestore e API Node para Vercel. Áudios e pacotes privados usam R2 ou B2 S3. A estrutura preserva o projeto Firebase e a coleção `musicas` do site original.

**Comece por [docs/CONFIGURACAO.md](docs/CONFIGURACAO.md).** A atualização depende das variáveis de servidor, das regras Firestore e de um processo para preparar pacotes; não é correto publicar somente o frontend.

## Desenvolvimento

```sh
npm ci
# Copie .env.server.example para .env.server e preencha localmente.
npm run dev:api
# Em outro terminal:
npm run dev
```

## Principais funcionalidades

- Player único fora das páginas; sequência automática por gênero, fila, temporizador, Media Session e equalizador em menu próprio.
- Catálogo com filtros combinados, páginas de cantor/gênero/mês, recomendações locais por gênero, playlists privadas e favoritos.
- Perfil, recuperação de senha, validade e renovação; chaves reutilizáveis com contagem e limite em transação.
- Downloads autorizados e pacotes preparados fora do celular; histórico de solicitações.
- Upload múltiplo diretamente ao armazenamento com progresso, tentativas individuais, hash de duplicação e confirmação no servidor.
- Edição em lote, CSV por ID, publicação agendada, verificação de arquivos, gestão de contas, avisos e auditoria.
- Backup privado e recuperação com prévia; migração gradual B2 → R2 e limpeza de campos de senha antigos.
- Interface responsiva, teclado, rótulos acessíveis, PWA, economia de imagens e efeitos opcionais.
- Checkout Pro opcional com webhook assinado e ativação transacional após pagamento aprovado.

## Testes

```sh
npm test
npm run test:integration
npx playwright install chromium
npm run test:browser
npm run build
```

Os testes usam projetos de demonstração em emuladores, sem modificar a base real. Leia [docs/ENTREGA.md](docs/ENTREGA.md) para o estado da entrega e as limitações de homologação.

## Preparação de pacotes

A workflow `.github/workflows/prepare-packages.yml` pode executar o processo a cada 15 minutos depois que a atualização estiver na branch padrão e os segredos forem configurados no GitHub. Sem configuração, ela não altera arquivos. A execução agendada do GitHub pode atrasar; não representa processamento instantâneo. Também há opção manual para antecipar grupos.

Não coloque credenciais de contas de serviço ou chaves de armazenamento nos commits. `.env.server.example` contém apenas exemplos vazios.
