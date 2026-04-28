# Deployment

## Render

1. Push repo len GitHub.
2. Vao Render, chon New > Blueprint.
3. Chon repo nay, Render se doc `render.yaml`.
4. Tao service, sau do mo URL Render cap.

Du lieu van hanh duoc luu trong persistent disk mount tai:

```text
/opt/render/project/src/server/storage
```

## VPS / server rieng

```bash
npm install
TOKEN_SECRET="doi-chuoi-bi-mat-rieng" npm start
```

Neu chay bang Docker:

```bash
docker build -t huydebug-spa .
docker run -p 8080:8080 -v "$(pwd)/server/storage:/app/server/storage" -e TOKEN_SECRET="doi-chuoi-bi-mat-rieng" huydebug-spa
```

Nen dat sau HTTPS reverse proxy nhu Caddy hoac Nginx.
