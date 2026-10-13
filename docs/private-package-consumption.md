# Consumo de pacotes privados

O ClickManager usa npm e mantém o token do GitHub Packages fora do repositório,
da imagem Docker e dos bundles.

## Desenvolvimento local

1. O `.npmrc` versionado contém somente configurações não secretas e o
   placeholder `${NODE_AUTH_TOKEN}`. Use `.npmrc.example` como referência para
   novos ambientes, sem substituir o arquivo por um token literal.
2. Exporte um token com permissão de leitura sem gravá-lo em arquivos:

```bash
export NODE_AUTH_TOKEN='<token com read:packages>'
npm ci
```

O `.npmrc` usa a interpolação `${NODE_AUTH_TOKEN}`. Não substitua o placeholder
por um valor literal e não execute comandos que imprimam o token.

## CI

Quando uma dependência privada for adicionada, o workflow deve fornecer
`NODE_AUTH_TOKEN` como secret somente ao passo de instalação:

```yaml
- name: Install dependencies
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NODE_AUTH_TOKEN }}
  run: npm ci
```

O secret `NODE_AUTH_TOKEN` está configurado no repositório
(`Settings → Secrets and variables → Actions`). Ele não deve ser usado como
`ARG`, `ENV`, parâmetro de build ou variável disponível nos passos de build e
deploy.

## Docker

O `Dockerfile` instala os pacotes privados com um secret BuildKit, usando o
mesmo secret `NODE_AUTH_TOKEN` do repositório:

```dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=secret,id=node_auth_token,env=NODE_AUTH_TOKEN \
    npm ci --legacy-peer-deps
```

O token é passado pelo passo `docker/build-push-action` com
`secrets: node_auth_token=${{ secrets.NODE_AUTH_TOKEN }}`. Localmente, o build
equivalente e:

```bash
NODE_AUTH_TOKEN='<token com read:packages>' \
docker build --secret id=node_auth_token,env=NODE_AUTH_TOKEN .
```

Não use `ARG NODE_AUTH_TOKEN`, `ENV NODE_AUTH_TOKEN` ou copie `.npmrc` para a
imagem. `.npmrc` está no `.dockerignore` para impedir o envio acidental de uma
configuração local autenticada ao contexto do build.

## Diagnóstico

- `npm ci` sem `NODE_AUTH_TOKEN` deve falhar somente quando houver dependência
  privada, sem registrar o valor do token.
- Verifique `git diff`, o contexto Docker e os artefatos gerados antes de abrir
  uma alteração de dependências.
- A instalação atual do ClickManager continua pública; a inclusão dos pacotes
  privados pertence à APP-5, após os upgrades de Angular.
