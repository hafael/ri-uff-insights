const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const port = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

const datasetPath = path.join(__dirname, 'dataset', 'dataset.json');
const grobidServiceUrl = 'http://grobid:8070/api/reference';

// Rota para health check
app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

// Rota para listar os documentos do dataset
app.get('/api/documents', async (req, res) => {
  try {
    const data = await fs.readFile(datasetPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Erro ao ler o arquivo de dataset:', error);
    res.status(500).send({ message: 'Erro interno do servidor' });
  }
});

// Função para converter JSON para TEI XML
function convertJsonToTeiXml(data) {
    let authorsXml = data.authors.split(',')
        .map(author => `<author>${author.trim()}</author>`)
        .join('\n');

    return `
<TEI xmlns="http://www.tei-c.org/ns/1.0">
    <teiHeader/>
    <text>
        <listBibl>
            <biblStruct>
                <analytic>
                    ${authorsXml}
                    <title level="a">${data.title}</title>
                </analytic>
                <monogr>
                    <title level="j">${data.journal}</title>
                    <imprint>
                        <biblScope unit="volume">${data.volume}</biblScope>
                        <biblScope unit="page">${data.pages}</biblScope>
                        <date when="${data.year}">${data.year}</date>
                    </imprint>
                </monogr>
                <note type="raw_reference">${data.full_text}</note>
            </biblStruct>
        </listBibl>
    </text>
</TEI>`;
}


// Rota para receber os dados de treinamento de referências
app.post('/api/training/reference', async (req, res) => {
    console.log('Recebidos dados de treinamento:', req.body);
    
    try {
        // 1. Converter os dados recebidos para TEI XML
        const teiXml = convertJsonToTeiXml(req.body);

        // 2. Montar o formulário para enviar ao GROBID
        const form = new FormData();
        form.append('input', teiXml, {
            filename: 'training-data.xml',
            contentType: 'application/xml',
        });

        // 3. Enviar para o serviço do GROBID
        await axios.post(grobidServiceUrl, form, {
            headers: form.getHeaders(),
        });
        
        console.log('Dados enviados com sucesso para o GROBID.');
        
        // Opcional: Salvar os dados de treinamento localmente
        // fs.appendFile('training_log.json', JSON.stringify(req.body) + '\n');
        
        res.status(200).json({ message: 'Dados de treinamento enviados com sucesso para o GROBID!' });

    } catch (error) {
        console.error('Erro ao processar o treinamento:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Falha ao comunicar com o serviço GROBID.' });
    }
});


app.listen(port, () => {
  console.log(`Servidor API ouvindo na porta ${port}`);
});