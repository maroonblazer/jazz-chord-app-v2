import { openai } from './openai.js';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';

// const question = process.argv[2] || 'hi';
const question = `Each row in this .csv file is a 'chord problem'. Which chord problem took the longest time to complete?`;

export const createStore = docs =>
  MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings());

// Load data from a CSV file
export const docsFromCSV = async () => {
  console.log('Loading data from CSV...');
  const loader = new CSVLoader('session-data-last-10.csv');
  return loader.loadAndSplit(
    new CharacterTextSplitter({
      separator: '.   ',
      chunkSize: 2500,
      chunkOverlap: 200,
    })
  );
};

const loadStore = async () => {
  const csvDocs = await docsFromCSV();
  console.log('Heres the csvDocs', csvDocs[0]);
  return createStore([...csvDocs]);
};

export const query = async () => {
  const store = await loadStore();
  const results = await store.similaritySearch(question, 10);
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-1106',
    temperature: 0,
    messages: [
      {
        role: 'assistant',
        content:
          'You are a helpful AI assistant. Answer questions to the best of your ability.',
      },
      {
        role: 'user',
        content: `Each row in the csv file contains a chord problem. The 'Time' column represents how long it took me to answer the chord problem for that row. Based on the data in the csv file, provide an analysis of my performance. E.g., which chord problems do I know well (i.e., took less time) and which chord problems should I spend more time practicing (i.e., took more time). Be as concise as possible. Every response should be in this format: 'SS1 R/3 in D Minor took the longest, at 4.8 secs.' If you cannot answer the question with the context, don't lie and make up stuff. Just say you need more context. 
        Question: ${question}
        Context: ${results.map(r => r.pageContent).join('\n')}`,
      },
    ],
  });
  console.log(
    `Logging results array:\n ${results.map(r => r.pageContent).join('\n')}`
  );
  return {
    answer: response.choices[0].message.content,
    sources: results.map(r => r.metadata.source).join(',  '),
  };
};
