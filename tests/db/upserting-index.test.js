import { Pinecone } from '@pinecone-database/pinecone';
import config from '../../constants/config.js';

const pc = new Pinecone({
    apiKey: config.pinecone,
});


console.log('Pinecone indexing test...');
const data = await pc.describeIndex('movies');
console.log(data);