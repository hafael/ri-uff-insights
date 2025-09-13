document.addEventListener('DOMContentLoaded', () => {
    const pdfSelect = document.getElementById('pdf-select');
    const pdfUrlInput = document.getElementById('pdf-url');
    const loadUrlBtn = document.getElementById('load-url-btn');
    const trainingForm = document.getElementById('training-form');
    const apiBaseUrl = 'http://localhost:3000/api';

    // Carrega a lista de documentos do dataset
    async function loadDocuments() {
        try {
            const response = await fetch(`${apiBaseUrl}/documents`);
            const documents = await response.json();
            
            pdfSelect.innerHTML = '<option value="">Selecione um documento</option>'; // Limpa opções
            documents.forEach(doc => {
                const option = document.createElement('option');
                option.value = doc.file;
                option.textContent = doc.title;
                pdfSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar documentos:', error);
            pdfSelect.innerHTML = '<option>Erro ao carregar</option>';
        }
    }

    // Lida com o envio do formulário de treinamento
    trainingForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const selectedPdf = document.getElementById('pdf-select').value;
        
        const trainingData = {
            pdf: selectedPdf,
            authors: document.getElementById('authors').value,
            title: document.getElementById('title').value,
            journal: document.getElementById('journal').value,
            year: document.getElementById('year').value,
            volume: document.getElementById('volume').value,
            pages: document.getElementById('pages').value,
            full_text: document.getElementById('full_text').value,
        };

        if (!trainingData.pdf || !trainingData.full_text) {
            alert('Por favor, selecione um PDF e preencha a referência completa.');
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/training/reference`, { // Endpoint atualizado
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(trainingData),
            });

            if (response.ok) {
                alert('Dados de treinamento enviados com sucesso!');
                trainingForm.reset(); // Limpa o formulário
            } else {
                const error = await response.json();
                alert(`Falha ao enviar dados: ${error.message}`);
            }
        } catch (error) {
            console.error('Erro ao enviar treinamento:', error);
            alert('Erro de conexão com a API.');
        }
    });

    // Lida com o envio do formulário de treinamento
    trainingForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const referenceText = document.getElementById('reference-text').value;
        const selectedPdf = pdfSelect.value;
        
        if (!referenceText || !selectedPdf) {
            alert('Por favor, selecione um PDF e insira o texto da referência.');
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/training`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pdf: selectedPdf, reference: referenceText }),
            });

            if (response.ok) {
                alert('Dados de treinamento enviados com sucesso!');
                document.getElementById('reference-text').value = '';
            } else {
                alert('Falha ao enviar dados de treinamento.');
            }
        } catch (error) {
            console.error('Erro ao enviar treinamento:', error);
            alert('Erro de conexão com a API.');
        }
    });

    // Inicializa
    loadDocuments();
});