import 'dotenv/config';

const config = {
    pinecone: process.env.PINECONE_API_KEY,
    modelName: 'llama-text-embed-v2',
    recordNamespace: 'movies-crawled-data',
    pcEmbed: 'https://api.pinecone.io/embed',
};

export default config;