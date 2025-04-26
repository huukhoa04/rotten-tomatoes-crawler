//pinecone set up\
import { Pinecone } from '@pinecone-database/pinecone';
import config from '../../constants/config.js';

const pinecone = new Pinecone({
  apiKey: config.pinecone,
});

export default pinecone;