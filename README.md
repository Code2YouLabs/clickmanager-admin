# clickmanager-admin

Painel de administração global do ecossistema ClickManager. É uma aplicação
Angular independente do ERP dos clientes e consome as rotas administrativas do
`clickmanager-backend`.

## Documentação do ecossistema

A documentação geral da arquitetura, infraestrutura, ambiente local e operação
do ClickManager está em:

https://github.com/Code2YouLabs/clickmanager-docs

## Requisitos

- Node.js 22.22.3 ou superior;
- npm;
- backend disponível em `http://localhost:8080` para uso local;
- Docker, somente para execução em container.

## Subir localmente

```bash
npm install
npm start
```

Acesse `http://localhost:4300`. Em desenvolvimento, a API é chamada em
`http://localhost:8080`; em produção, as URLs são relativas ao mesmo domínio.

## Testar e gerar o build

```bash
npm test -- --watch=false
npm run build:prod
```

O build é gerado em `dist/clickmanager-admin/browser`.

## Subir com Docker

```bash
docker build -t clickmanager-admin .
docker run --rm -p 8081:80 clickmanager-admin
```

Acesse `http://localhost:8081`. O Nginx do container possui fallback para
`index.html`, portanto o refresh de rotas Angular deve funcionar.

## Produção

- domínio: `https://admin.clickmanager.com.br`;
- imagem: `ghcr.io/code2youlabs/clickmanager-admin:latest`;
- serviço no compose da VPS: `admin`;
- build: `.github/workflows/build-admin.yml`;
- deploy: `.github/workflows/deploy-admin.yml`.

O push na `main` gera a imagem. Após o build aprovado, o deploy atualiza apenas
o serviço `admin` em `/opt/clickmanager`. O repositório precisa dos secrets
`SSH_HOST`, `SSH_USER` e `SSH_PRIVATE_KEY`.

Deploy manual na VPS:

```bash
cd /opt/clickmanager
docker-compose -f docker-compose.prod.yml pull admin
docker-compose -f docker-compose.prod.yml up -d --no-deps admin
docker-compose -f docker-compose.prod.yml ps admin
```

## Integração

- login administrativo: `/admin/auth/login`;
- APIs administrativas: `/api/admin/**`;
- o proxy principal deve encaminhar `/admin/auth/` e `/api/` ao backend.
