//helper function for pinecone db
import config from '../../constants/config.js';
import index_host from '../../constants/db-index.js';
import getRottenTomatoesSlug from '../../utils/get-url-slug.js';
import pinecone from './pinecone.js';
import axios from 'axios';
import fs from 'fs';

const INDEX_NAME = 'movies'; // Change to your Pinecone index name


/**
 * Upserts movie objects into Pinecone.
 * @param {object[]} movieDatas - The movie data objects.
 * @returns {Promise<any>}
 */
export async function upsertMovies(movieDatas) {
    
  const index = pinecone.index(INDEX_NAME, index_host.movies);

    const embeddedData = await embedMovies(movieDatas);
  // Example: use movie title + year or url as unique id
  const records = movieDatas.map((d, i) => ({
    id: getRottenTomatoesSlug(d.url) || `movie-${i}`,
    values: embeddedData[i].values,
    metadata: {
      title: d.movieTitle || '',
      visual: d.movieImage || '',
      genres: (d.genres || []).join(', '),
      cast: d.cast || '',
      description: d.movieDesc || '',
      metadata: (d.metadataArr || []).join(', '),
      criticsScore: d.criticsScore ? d.criticsScore.toString() : '',
      criticReviews: d.criticReviews ? d.criticReviews.toString() : '',
      criticsConsensus: d.criticsConsensus || '',
      audienceConsensus: d.audienceConsensus || '',
      audienceScore: d.audienceScore ? d.audienceScore.toString() : '',
      audienceVerifiedCount: d.audienceVerifiedCount ? d.audienceVerifiedCount.toString() : '',
    }
  }));
  console.log(JSON.stringify(records));

  return await index.namespace(config.recordNamespace).upsert(records);
}

/**
 * Dummy embedding function - replace with real embedding logic.
 * @param {object][]} movieDatas
 * @returns {object[]}
 */
async function embedMovies(movieDatas) {
    const model = config.modelName;
    let headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'api-key': config.pinecone,
      'x-pinecone-api-version': '2025-04',
    }; 
    let data = {
      'model': model,
      'parameters': {
          'input_type': 'passage',
          'truncate': 'END',
          'dimension': 768
      },
      'inputs': movieDatas.map((d) => ({
        'text': [
          d.movieTitle,
          ...(d.genres || []),
          d.movieDesc,
          d.cast,
          ...(d.metadataArr || []),
          d.criticsScore,
          d.criticReviews,
          d.audienceScore,
          d.audienceVerifiedCount,
          d.criticsConsensus,
          d.audienceConsensus,
        ].filter(Boolean).join(' | ')
      }))
    };
    try {
        const response = await axios.post(config.pcEmbed, data, { headers });
        const embeddings = response.data;
        console.log(JSON.stringify(embeddings));
        return embeddings.data;
    } catch (error) {
        console.error('Error embedding movies:', error.message);
        fs.writeFileSync('error_log.txt', `Error embedding movies: ${error.message}\n`, { flag: 'a' });
        throw error;
    }
}