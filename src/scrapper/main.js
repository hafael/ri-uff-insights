// main.js

// Axios - Promise based HTTP client for the browser and node.js
import axios from 'axios';
// Cheerio - The fast, flexible & elegant library for parsing and manipulating HTML and XML
import * as cheerio from 'cheerio';
// Node.js File System module
import fs from 'fs';
import path from 'path';

// --- CONFIGURAÇÃO ---
// Pega o argumento da linha de comando para o ano limite. Ex: node main.js 2020
const py_limit = process.argv[2];
const pyLimitNb = py_limit ? Number(py_limit) : null;
if (pyLimitNb) {
    console.log(`Executando com limite de ano: ${pyLimitNb}`);
} else {
    console.log('Executando sem limite de ano.');
}

const startTime = new Date();
const delayMs = 1000;
const baseUrl = 'https://app.uff.br';

const snooze = (ms, fnName) => {
    console.log(`Dormindo por ${ms} ms... [${fnName || 'unknown'}]`);
    return new Promise(resolve => setTimeout(resolve, ms));
};

const fileExistsInCachedStorage = (pathName) => {
    return fs.existsSync(pathName);
};

const addItemToCachedStorage = (item, pathName) => {
    const dir = path.dirname(pathName);
    fs.mkdirSync(dir, { recursive: true });

    if (!fileExistsInCachedStorage(pathName)) {
        fs.writeFileSync(pathName, JSON.stringify(item, null, 2));
        console.log(`Item ${item.id} salvo no cache.`);
    }
};

const fetchItemDetails = async (item) => {
    const pathName = `./dataset/cache/${item.id}.json`;

    if (fileExistsInCachedStorage(pathName)) {
        console.log(`Item ${item.id} encontrado no cache, carregando do arquivo.`);
        const cachedData = fs.readFileSync(pathName);
        return JSON.parse(cachedData);
    }

    await snooze(delayMs, 'fetchItemDetails');

    const res = await axios.get(item.url);
    const $i = cheerio.load(res.data);

    const tbEl = $i('table.detailtable tbody tr');

    tbEl.each((j, row) => {
        const attrString = $i(row).find('td.metadata-key').prop('title').trim();
        const attrValue = $i(row).find('td.metadata-field').text().trim();

        const addToArray = (key, value) => {
            if (!item[key]) {
                item[key] = [];
            }
            item[key].push(value);
        };

        if (attrString === 'dc.contributor.author') { item.author = attrValue; }
        if (attrString === 'dc.date.available') { item.date_available = attrValue; }
        if (attrString === 'dc.date.issued') { item.date_issued = attrValue; }
        if (attrString === 'dc.identifier.citation[pt_BR]' || attrString === 'dc.identifier.citation') { item.citation = attrValue; }
        if (attrString === 'dc.description.abstract[pt_BR]' || attrString === 'dc.description.abstract') { item.abstract = attrValue; }
        if (attrString === 'dc.language.iso[pt_BR]') { item.language_iso = attrValue; }
        if (attrString === 'dc.rights[pt_BR]') { item.rights = attrValue; }
        if (attrString === 'dc.title[pt_BR]') { item.title = attrValue; }
        if (attrString === 'dc.subject.keyword[pt_BR]') {
            addToArray('keywords', attrValue);
        }
        if (attrString === 'dc.subject.keywordother[pt_BR]') {
            addToArray('additional_keywords', attrValue);
        }
        if (attrString === 'dc.degree.level[pt_BR]') { item.degree_level = attrValue; }
        if (attrString === 'dc.subject.descriptor[pt_BR]') {
            addToArray('descriptors', attrValue);
        }
        if (attrString === 'dc.degree.grantor[pt_BR]') { item.degree_grantor = attrValue; }
        if (attrString === 'dc.degree.department[pt_BR]') { item.degree_department = attrValue; }
        if (attrString === 'dc.degree.date[pt_BR]' || attrString === 'dc.degree.date') { item.degree_date = attrValue; }
        if (attrString === 'dc.degree.local[pt_BR]') { item.degree_local = attrValue; }
        if (attrString === 'dc.degree.curso[pt_BR]') { item.degree_program = attrValue; }
        if (attrString === 'dc.identifier.vinculation[pt_BR]') { item.vinculation = attrValue; }
        if (attrString === 'dc.description.sponsorship[pt_BR]') { item.sponsorship = attrValue; }

        if (attrString === 'dc.contributor.advisor1' || attrString === 'dc.contributor.advisor') {
            if (item.advisor || typeof item.advisor === 'string') {
                addToArray('co_advisors', attrValue);
            } else {
                item.advisor = attrValue;
            }
        }

        if (attrString === 'dc.contributor.advisor-co1' || attrString === 'dc.contributor.advisor-co2') {
            addToArray('co_advisors', attrValue);
        }

        if (['dc.contributor.members', 'dc.contributor.referee1', 'dc.contributor.referee2', 'dc.contributor.referee3', 'dc.contributor.referee4'].includes(attrString)) {
            addToArray('board_members', attrValue);
        }

        if (attrString === 'dc.rights.license[pt_BR]') { item.rights_license = attrValue; }
        if (attrString === 'dc.description.physical[pt_BR]') { item.physical_description = attrValue; }
    });

    item.document_url = baseUrl + $i('.file-wrapper a').prop('href');
    item.document_file_name = $i('.file-wrapper .file-metadata dd:nth-of-type(1)').text().trim();
    item.document_file_size = $i('.file-wrapper .file-metadata dd:nth-of-type(2)').text().trim();

    addItemToCachedStorage(item, pathName);

    return item;
};

const parseItems = async (items) => {
    const data = [];
    for (const item of items) {
        let payload = await fetchItemDetails(item);
        payload = Object.assign(item, payload);
        data.push(payload);
    }
    return data;
};

const fetchPage = async (collection, pageUrl) => {
    await snooze(delayMs, 'fetchPage');

    const response = await axios.get(pageUrl);
    const $ = cheerio.load(response.data);

    let items = [];
    $('ul.ds-artifact-list li.ds-artifact-item').each((i, element) => {
        const item = {
            id: $(element).find('.artifact-title a').prop('href').match(/\/handle\/\d+\/(\d+)/)[1],
            title: $(element).find('.artifact-title a').text(),
            author: $(element).find('.artifact-info .author span').text(),
            url: baseUrl + $(element).find('.artifact-title a').prop('href') + '?show=full',
            collection_id: collection.url.match(/\/handle\/\d+\/(\d+)/)[1],
            collection_name: collection.name,
            collection_description: collection.description,
            collection_url: collection.url
        };
        items.push(item);
    });

    items = await parseItems(items);
    console.log(`Total de itens nesta página: ${items.length}`);

    if (items.length === 0) {
        return [];
    }
    
    const lastItem = items[items.length - 1];
    const lastPublicationYear = parseInt(lastItem.degree_date);
    console.log('Ano de publicação do último item da página:', lastPublicationYear);

    const nextPageNode = $('ul.pagination li.next a.next-page-link');
    let nextPageItems = [];

    if (nextPageNode.length > 0 && nextPageNode.prop('href')) {
        // Se o ano limite foi atingido, não busca a próxima página
        if (pyLimitNb && lastPublicationYear < pyLimitNb) {
             console.log(`Limite de ano ${pyLimitNb} atingido. Não buscando a próxima página.`);
        } else {
            const nextPageUrl = baseUrl + nextPageNode.prop('href');
            console.log(`Próxima página detectada: ${nextPageUrl}`);
            nextPageItems = await fetchPage(collection, nextPageUrl);
        }
    }
    
    const filteredItems = items.filter(item => {
        const itemYear = parseInt(item.degree_date);
        if (!pyLimitNb) return true;
        return itemYear >= pyLimitNb;
    });

    return filteredItems.concat(nextPageItems);
};

const fetchCollections = async (collections) => {
    for (const collection of collections) {
        console.log(`Buscando coleção: ${collection.name} - ${collection.url}`);
        const items = await fetchPage(collection, collection.url + '/recent-submissions');
        collection.items = items;
    }
    return collections;
};

const generateJsonFile = (data) => {
    const dateTime = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = `./dataset/riuff-data-${dateTime}.json`;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Dataset salvo em ${filePath}`);
    return filePath;
};

const handle = async () => {
    console.log('Iniciando o processo de crawling...');

    let collections = [
        {
            name: 'TCCs (Graduação)',
            description: 'GGB - Trabalhos de Conclusão de Curso - Niterói',
            url: 'https://app.uff.br/riuff/handle/1/13580',
            items: []
        },
        {
            name: 'Dissertações (Mestrado)',
            description: 'PPGCI - Mestrado - Niterói',
            url: 'https://app.uff.br/riuff/handle/1/14110',
            items: []
        },
        {
            name: 'Teses (Doutorado)',
            description: 'PPGCI - Doutorado - Niterói',
            url: 'https://app.uff.br/riuff/handle/1/14108',
            items: []
        },
    ];

    collections = await fetchCollections(collections);

    const endTime = new Date();
    const allItems = collections.map(col => col.items).flat();

    console.log('Crawling finalizado!');
    console.log(`Iniciado em: ${startTime.toISOString()}`);
    console.log(`Finalizado em: ${endTime.toISOString()}`);
    console.log('Duração total (minutos):', ((endTime - startTime) / 60000).toFixed(2));
    
    const totalItems = allItems.length;
    console.log('Total de itens coletados:', totalItems);

    generateJsonFile(allItems);
};

// Executa a função principal
handle();