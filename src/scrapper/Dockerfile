# Dockerfile

# Use uma imagem oficial do Node.js como base
FROM node:18-slim

# Crie e defina o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copie os arquivos de definição de dependências
COPY package*.json ./

# Instale as dependências do projeto
RUN npm install

# Copie o código-fonte da aplicação para o diretório de trabalho
COPY . .

# Comando para executar a aplicação
# Você pode passar argumentos de linha de comando aqui ou no docker-compose.yml
# Exemplo: CMD [ "node", "main.js", "2020" ]
CMD [ "node", "main.js" ]