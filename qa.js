import { openai } from './openai.js';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';

// const question = process.argv[2] || 'hi';
// const question = `Which chord problem needs the most practice? I.e. which one took the longest time to complete?`;

export const createStore = docs =>
  MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings());

// Load data from a CSV file
export const docsFromCSV = async csvFile => {
  console.log('Loading data from CSV...');
  const loader = new CSVLoader(csvFile);
  return loader.loadAndSplit(
    new CharacterTextSplitter({
      separator: '.   ',
      chunkSize: 2500,
      chunkOverlap: 200,
    })
  );
};

const loadStore = async csvFile => {
  const csvDocs = await docsFromCSV(csvFile);
  console.log('Heres the csvDocs', csvDocs[0]);
  return createStore([...csvDocs]);
};

export const query = async (
  csvFile,
  k,
  question = 'Which 3 chord problems need the most practice? I.e. which ones took the longest time to complete?'
) => {
  const store = await loadStore(csvFile);
  const results = await store.similaritySearch(question, k);
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    temperature: 0,
    messages: [
      {
        role: 'assistant',
        content:
          'You are a helpful AI assistant. Answer questions to the best of your ability.',
      },
      {
        role: 'user',
        content: `Each row in the csv file contains a chord problem. The 'Time' column represents how long it took me to answer the chord problem for that row. Chord problems with a smaller time value took less time. Chord problems with larger time values took more time. The longer a chord problem takes, the more I need to practice it. When asked which chord problem took the longest time to complete, determine the answer by comparing the values in the 'Time' column. The problem with the largest value for 'Time' is the problem that needs the most practice. Be as concise as possible. Format your response like the following example:
		        'String Set 2, Root on 3, in C Minor took 24.3 seconds. \n
		        String Set 1 Root on 1, in Db Minor took 14.5 seconds. \n
		        String Set 1 Root on 4, in A# Major took 11.2 seconds. \n'
		        Each problem should be separated by a line break. Do not add any additional text. If you cannot answer the question with the context, don't lie and make up stuff. Just say you need more context. 
        Question: ${question}
        Context: ${results.map(r => r.pageContent).join('\n')}`,
      },
    ],
  });
  console.log(
    // `Logging results array:\n ${results.map(r => r.pageContent).join('\n')}`
    `Logging results array...not really, but let's say we are`
  );
  return {
    answer: response.choices[0].message.content,
    sources: results.map(r => r.metadata.source).join(',  '),
  };
};
