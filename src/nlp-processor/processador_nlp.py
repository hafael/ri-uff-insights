import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
import nltk
from nltk.corpus import stopwords
import spacy
from spacy.matcher import PhraseMatcher
from spacy.tokens import Doc ##-- NOVO --##
from spacy.language import Language ##-- NOVO --##
from sentence_transformers import SentenceTransformer, util
import torch
import json
from collections import Counter

# --- BLOCO DE DOWNLOAD (Executado apenas se necessário) ---
try:
    stopwords.words('portuguese')
except LookupError:
    print("Baixando a lista de stopwords do NLTK (executado apenas uma vez)...")
    nltk.download('stopwords')
    print("Download concluído.")

# --- SCRIPT PRINCIPAL ---

def processar_nlp():
    """
    Script principal para carregar os dados e executar um pipeline de PLN
    avançado, com componentes customizados para uma análise rica e estruturada.
    """
    # --- 1. CONFIGURAÇÃO E CARREGAMENTO DOS DADOS ---
    print("Iniciando o script de processamento NLP...")
    
    input_filepath = "/app/dataset/dataset.json"
    taxonomy_filepath = "/app/dataset/categories.json"
    output_filepath = "/app/dataset/dataset_enriquecido.json"

    try:
        df = pd.read_json(input_filepath)
        print(f"Dados carregados com sucesso. {len(df)} documentos encontrados.")
    except FileNotFoundError:
        print(f"ERRO: Arquivo de entrada não encontrado em '{input_filepath}'.")
        return

    if 'abstract' not in df.columns:
        print("ERRO: A coluna 'abstract' não foi encontrada no JSON.")
        return
    df['abstract'] = df['abstract'].fillna('')
    abstracts = df['abstract'].tolist()

    termos_metodologicos = [
        "revisão sistemática", "revisão sistemática da literatura", "análise de domínio",
        "ciência aberta", "web semântica", "arquitetura da informação", "análise de citação",
        "estudo de caso", "estudo bibliométrico", "análise de conteúdo", "engenharia de ontologias",
        "mineração de dados", "mineração de texto", "processamento de linguagem natural"
    ]

    print("Carregando modelos de NLP (pode levar alguns minutos)...")
    try:
        nlp_spacy = spacy.load("pt_core_news_lg")
    except OSError:
        print("ERRO: Modelo 'pt_core_news_lg' não encontrado. Por favor, execute 'python -m spacy download pt_core_news_lg'")
        return
    
    similarity_model = SentenceTransformer('distiluse-base-multilingual-cased-v1')
    print("Modelos carregados.")

    ##-- ALTERADO: Configuração do Pipeline spaCy --##
    # Iremos configurar o pipeline com todos os nossos componentes customizados.

    # 1. Adiciona o EntityRuler para entidades customizadas
    ruler = nlp_spacy.add_pipe("entity_ruler", before="ner")
    patterns_ruler = [
        {"label": "ORG", "pattern": "SciELO"}, {"label": "ORG", "pattern": "CAPES"},
        {"label": "ORG", "pattern": "CNPq"}, {"label": "MISC", "pattern": "Plataforma Lattes"},
        {"label": "MISC", "pattern": [{"LOWER": "plataforma"}, {"LOWER": "sucupira"}]},
    ]
    ruler.add_patterns(patterns_ruler)

    # 2. Prepara o PhraseMatcher
    matcher = PhraseMatcher(nlp_spacy.vocab, attr='LOWER')
    patterns_matcher = [nlp_spacy.make_doc(termo) for termo in termos_metodologicos]
    matcher.add("METODOLOGIAS_CI", patterns_matcher)

    # 3. Define os atributos customizados que nosso componente irá preencher
    Doc.set_extension("entities", default=[])
    Doc.set_extension("methodologies", default=[])
    Doc.set_extension("relationships", default=[])

    # 4. Cria o componente customizado que centraliza nossa lógica de extração
    @Language.component("pipeline_analise_cientifica")
    def pipeline_analise_cientifica_func(doc):
        # Lógica de extração de entidades
        doc._.entities = [{'text': ent.text.strip(), 'type': ent.label_} for ent in doc.ents if ent.label_ in ['PER', 'ORG', 'LOC', 'MISC']]
        
        # Lógica de extração de metodologias (usando o matcher definido fora do componente)
        matches = matcher(doc)
        doc._.methodologies = list({doc[start:end].text for _, start, end in matches})
        
        # Lógica de extração de relações SVO
        relacoes = []
        for sent in doc.sents:
            for token in sent:
                if token.pos_ == 'VERB':
                    verbo = token
                    sujeitos = [child for child in verbo.children if child.dep_ == 'nsubj']
                    objetos = [child for child in verbo.children if child.dep_ == 'obj']
                    if sujeitos and objetos:
                        for s in sujeitos:
                            for o in objetos:
                                if s.pos_ in ['NOUN', 'PROPN'] and o.pos_ in ['NOUN', 'PROPN']:
                                    relacoes.append([s.lemma_, verbo.lemma_, o.lemma_])
        doc._.relationships = relacoes
        return doc

    # 5. Adiciona nosso componente customizado ao final do pipeline
    nlp_spacy.add_pipe("pipeline_analise_cientifica", last=True)
    print("Pipeline spaCy configurado com componentes customizados.")

    # Processa todos os resumos com o pipeline completo de uma só vez
    print("Processando todos os resumos com o pipeline spaCy completo...")
    docs = list(nlp_spacy.pipe(abstracts))
    print("Processamento spaCy concluído.")

    # --- 2. CLASSIFICAÇÃO TEMÁTICA GUIADA ---
    # (Esta seção permanece a mesma)
    print("Iniciando a Classificação Temática Guiada...")
    try:
        with open(taxonomy_filepath, 'r', encoding='utf-8') as f:
            categories_data = json.load(f)
        taxonomy_data = categories_data['children']
    except FileNotFoundError:
        print(f"ERRO: Arquivo de taxonomia não encontrado em '{taxonomy_filepath}'.")
        return
    
    topic_descriptors = [cat['name'] + " " + " ".join([child['name'] for child in cat.get('children', [])]) for cat in taxonomy_data]
    topic_labels = [cat['name'] for cat in taxonomy_data]
    
    abstract_embeddings = similarity_model.encode(abstracts, convert_to_tensor=True, show_progress_bar=True)
    topic_embeddings = similarity_model.encode(topic_descriptors, convert_to_tensor=True)
    
    cosine_scores = util.cos_sim(abstract_embeddings, topic_embeddings)
    top_topic_indices = torch.argmax(cosine_scores, axis=1)
    
    df['topic_label'] = [topic_labels[idx] for idx in top_topic_indices]
    df['topic'] = [idx.item() + 1 for idx in top_topic_indices]
    print("Classificação Temática concluída.")

    ##-- ALTERADO: Seções de extração agora leem os atributos customizados --##
    # --- 3. EXTRAÇÃO DE DADOS ESTRUTURADOS DO PIPELINE ---
    print("Extraindo dados dos atributos customizados...")
    df['entities'] = [doc._.entities for doc in docs]
    df['methodologies'] = [doc._.methodologies for doc in docs]
    df['relationships'] = [doc._.relationships for doc in docs]
    print("Extração de dados estruturados concluída.")

    # Bloco de análise de entidades
    todas_entidades = [ent['text'] for sublist in df['entities'] for ent in sublist if ent['type'] == 'ORG']
    contagem_entidades = Counter(todas_entidades)
    print("\n--- Top 10 Organizações Mais Frequentes ---")
    for entidade, contagem in contagem_entidades.most_common(10):
        print(f"{entidade}: {contagem}")
    print("-------------------------------------------\n")

    # --- 4. EXTRAÇÃO DE PALAVRAS-CHAVE ---
    print("Iniciando a Extração de Palavras-chave...")
    
    def tokenizer_spacy_from_doc(doc):
        return [token.lemma_ for token in doc if token.pos_ in ['NOUN', 'PROPN'] and not token.is_stop and not token.is_punct]

    docs_for_tfidf = [" ".join(tokenizer_spacy_from_doc(doc)) for doc in docs]

    kw_vectorizer = TfidfVectorizer(max_df=0.60, min_df=5)
    X_kw = kw_vectorizer.fit_transform(docs_for_tfidf)
    kw_feature_names = kw_vectorizer.get_feature_names_out()

    def extrair_keywords_melhorada(doc_vector, feature_names):
        df_vector = pd.DataFrame(doc_vector.T.todense(), index=feature_names, columns=["tfidf"])
        top_keywords = df_vector.nlargest(5, "tfidf").index.tolist()
        return top_keywords
        
    df['auto_keywords'] = [extrair_keywords_melhorada(X_kw[i], kw_feature_names) for i in range(len(docs))]
    print("Extração de Palavras-chave concluída.")

    # --- 5. CÁLCULO DE SIMILARIDADE ---
    print("Calculando a similaridade entre documentos...")
    cosine_scores_docs = util.cos_sim(abstract_embeddings, abstract_embeddings)

    def encontrar_similares(doc_index, scores, num_similares=5):
        doc_scores = scores[doc_index]
        top_indices = torch.topk(doc_scores, k=num_similares + 1).indices.tolist()
        similar_ids = [df['id'].iloc[idx] for idx in top_indices if idx != doc_index]
        return similar_ids[:num_similares]

    df['similar_docs'] = [encontrar_similares(i, cosine_scores_docs) for i in range(len(df))]
    print("Cálculo de similaridade concluído.")

    # --- 6. SALVAR RESULTADO ---
    print(f"Salvando dados enriquecidos em '{output_filepath}'...")
    df.to_json(output_filepath, orient='records', indent=4, force_ascii=False)
    print("Processo concluído com sucesso!")


if __name__ == "__main__":
    processar_nlp()