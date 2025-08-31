# RI UFF Insights: Dashboard de Produção Acadêmica

![Status](https://img.shields.io/badge/status-ativo-success.svg)
![Licença](https://img.shields.io/badge/licença-MIT-blue.svg)

> Uma ferramenta interativa para visualização e análise da produção acadêmica (TCCs, Dissertações e Teses) dos cursos de Biblioteconomia e Ciência da Informação da Universidade Federal Fluminense (UFF).

Este projeto transforma um conjunto de dados extraído do Repositório Institucional da UFF em um dashboard dinâmico, permitindo a exploração de tendências, redes de colaboração e a evolução dos temas de pesquisa ao longo do tempo.

---

## 🚀 Acesse Online

Acesse a versão interativa do dashboard, hospedada no GitHub Pages:

**[https://hafael.github.io/ri-uff-insights/](https://hafael.github.io/ri-uff-insights/)**

---

![Screenshot do Dashboard](https://i.imgur.com/BlWSCt6.png)

## ✨ Funcionalidades

O dashboard oferece múltiplas camadas de análise dos dados acadêmicos:

* **Visão Geral:** Métricas consolidadas sobre o total de trabalhos, distribuição por tipo e produção anual.
* **Filtros Combinados:** Filtre a base de dados por Área Temática, Ano de Defesa, Orientador e Tipo de Trabalho (TCC, Dissertação, Tese).
* **Lista de Trabalhos Interativa:** Navegue pelos trabalhos em cards detalhados e acesse o resumo e links para o documento original.
* **Índices de Autores e Orientadores:** Tabelas que quantificam a produção e participação de cada pesquisador.
* **Análise de Rede de Colaboração:** Um grafo interativo que visualiza as conexões entre orientadores, autores e membros de banca, destacando os pesquisadores mais centrais.
* **Gráfico de Evolução Temática:** Acompanhe a popularidade de qualquer palavra-chave ao longo dos anos em um gráfico de linha dinâmico.
* **Análise da Jornada do Autor:** Selecione um autor e visualize sua trajetória acadêmica completa, incluindo todos os seus trabalhos, orientadores e temas pesquisados.
* **Exportação e Impressão:** Gere um PDF de alta qualidade do relatório ou imprima diretamente do navegador com formatação otimizada para leitura.

## 📊 Sobre os Dados

As informações apresentadas no dashboard são provenientes de um recorte específico do acervo digital da universidade.

* **Fonte:** [Repositório Institucional da UFF (RIUFF)](https://app.uff.br/riuff/)
* **Recorte:** Trabalhos de Conclusão de Curso, Dissertações e Teses dos cursos de Biblioteconomia e Ciência da Informação.
* **Período Temporal:** A base de dados abrange trabalhos defendidos entre **2015 e 2025**.
* **Versão dos Dados:** A data da última atualização dos dados corresponde à data de modificação do arquivo `dataset.json` na raiz deste repositório.

> ### Aviso Importante sobre os Dados
> Todos os trabalhos e metadados aqui apresentados pertencem integralmente ao **Repositório Institucional da UFF (RIUFF)**. A extração dos dados foi realizada de forma ética, com o propósito excepcional de estudos para fins acadêmicos e científicos.
>
> Esta página **não substitui a fonte original** e não deve ser considerada uma representação oficial. Os dados estão vulneráveis a possíveis falhas no processo de extração ou apresentação, portanto, não podem ser reconhecidos como uma verdade absoluta. Para informações oficiais e fidedignas, consulte sempre o repositório original.

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído inteiramente com tecnologias front-end, sem a necessidade de um servidor.

* **HTML5**
* **Tailwind CSS** para estilização
* **JavaScript (ES6+)**
* **Chart.js** para gráficos (barras e linhas)
* **vis.js (vis-network)** para a visualização da rede de colaboração
* **jspdf** e **html2canvas** para a funcionalidade de exportação para PDF

## 💡 Desenvolvimento e Infraestrutura

Este projeto foi desenvolvido e é mantido com o auxílio das seguintes ferramentas e serviços:

* **Vibe codado com:** Gemini, Amazon Q e Visual Studio Code
* **Hospedagem:** GitHub Pages
* **Coleta de dados:** Apify

## 💻 Como Executar Localmente

Como este é um projeto puramente front-end, não há necessidade de instalação de dependências ou de um servidor web.

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/hafael/ri-uff-insights.git](https://github.com/hafael/ri-uff-insights.git)
    ```
2.  **Navegue até a pasta do projeto:**
    ```bash
    cd ri-uff-insights
    ```
3.  **Abra o arquivo `index_v4.html`** diretamente no seu navegador de preferência (Google Chrome, Firefox, etc.).

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE.md) para mais detalhes.
