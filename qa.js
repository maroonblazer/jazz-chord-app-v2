import { openai } from './openai.js';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';
// import { YoutubeLoader } from 'langchain/document_loaders/web/youtube';
// import { PDFLoader } from 'langchain/document_loaders/fs/pdf';

// const question = process.argv[2] || 'hi';
const question = `Which row in this csv file took the longest time to complete?`;
// const video = `https://youtu.be/zR_iuq2evXo?si=cG8rODgRgXOx9_Cn`;

export const createStore = docs =>
  MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings());

// export const docsFromYTVideo = async video => {
//   const loader = YoutubeLoader.createFromUrl(video, {
//     language: 'en',
//     addVideoInfo: true,
//   });
//   return loader.loadAndSplit(
//     new CharacterTextSplitter({
//       separator: ' ',
//       chunkSize: 5000,
//       chunkOverlap: 100,
//     })
//   );
// };

// export const docsFromPDF = () => {
//   const loader = new PDFLoader('xbox.pdf');
//   return loader.loadAndSplit(
//     new CharacterTextSplitter({
//       separator: '.   ',
//       chunkSize: 2500,
//       chunkOverlap: 200,
//     })
//   );
// };

// Load data from a CSV file
export const docsFromCSV = async () => {
  console.log('Loading data from CSV...');
  const loader = new CSVLoader('session-data.csv');
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
  // const videoDocs = await docsFromYTVideo(video);
  // const pdfDocs = await docsFromPDF();
  // console.log(videoDocs[0], pdfDocs[0]);
  // console.log(videoDocs[0]);
  // return createStore([...videoDocs, ...pdfDocs]);
};

export const query = async () => {
  const store = await loadStore();
  const results = await store.similaritySearch(question, 10);
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    temperature: 0,
    messages: [
      {
        role: 'assistant',
        content:
          'You are a helpful AI assistant. Answer questions to the best of your ability.',
      },
      {
        role: 'user',
        content: `Each row in the csv file contains a chord problem. The 'Time' column represents how long it took me to answer the chord problem for that row. Based on the data in the csv file, provide an analysis of my performance. E.g., which chord problems do I know well (i.e., took less time) and which chord problems should I spend more time practicing (i.e., took more time). Be concise. If you cannot answer the question with the context, don't lie and make up stuff. Just say you need more context. 
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
