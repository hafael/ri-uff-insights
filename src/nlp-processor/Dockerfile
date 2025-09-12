# Use uma imagem oficial do Python como base
FROM python:3.9-slim

# Defina o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copie o arquivo de dependências para o diretório de trabalho
COPY requirements.txt .

# Instale as dependências listadas no requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Baixe o modelo de linguagem em português para o spaCy
RUN python -m spacy download pt_core_news_lg

# Copie os diretórios de dados e scripts locais para o contêiner
COPY . .

# Defina o comando padrão a ser executado quando o contêiner iniciar
CMD ["python", "processador_nlp.py"]