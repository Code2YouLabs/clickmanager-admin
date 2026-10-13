# Renomeação do admin em produção

A Administração Global passa a usar o nome oficial `clickmanager-admin`.

## Alterações no Compose da VPS

No arquivo `/opt/clickmanager/docker-compose.prod.yml`, altere:

```yaml
admin-frontend:
  image: ghcr.io/leonardombr89/clickmanager-admin-frontend:latest
  container_name: clickmanager-admin-frontend
```

para:

```yaml
admin:
  image: ghcr.io/leonardombr89/clickmanager-admin:latest
  container_name: clickmanager-admin
```

No `depends_on` do serviço `nginx`, altere `admin-frontend` para `admin`.

## Alteração no Nginx

No arquivo `/opt/clickmanager/nginx/conf.d/default.conf`, prepare a troca:

```nginx
set $admin http://clickmanager-admin-frontend:80;
```

para:

```nginx
set $admin http://clickmanager-admin:80;
```

Não recarregue o Nginx antes de o novo container existir.

## Ordem da virada

1. Valide o Compose preparado:

   ```bash
   cd /opt/clickmanager
   docker-compose -f docker-compose.prod.yml config --quiet
   docker exec clickmanager-nginx nginx -t
   ```

2. Faça o merge na `main` e aguarde a publicação da imagem.
3. Confirme que o novo container está saudável:

   ```bash
   docker-compose -f docker-compose.prod.yml ps admin
   docker logs --tail 100 clickmanager-admin
   ```

4. Somente então altere o upstream no `default.conf` e recarregue:

   ```bash
   docker exec clickmanager-nginx nginx -t
   docker exec clickmanager-nginx nginx -s reload
   curl -I https://admin.clickmanager.com.br
   ```

5. Após validar o domínio, remova o container antigo:

   ```bash
   docker rm -f clickmanager-admin-frontend
   ```
