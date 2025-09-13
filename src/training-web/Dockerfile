# Estágio de build para o CSS
FROM node:18 as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:css

# --- PASSO DE VERIFICAÇÃO ---
# Lista o conteúdo da pasta public para confirmar que o style.css foi criado.
RUN ls -l /app/public
# -----------------------------

# Estágio final com Nginx
FROM nginx:alpine
COPY --from=builder /app/public /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]