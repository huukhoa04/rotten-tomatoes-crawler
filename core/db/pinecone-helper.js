//helper function for pinecone db
import config from '../../constants/config.js';
import index_host from '../../constants/db-index.js';
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
    id: d.url || `movie-${i}`,
    values: embeddedData[i].values,
    metadata: {
      title: d.movieTitle || "",
      genres: (d.genres || []).join(", "),
      description: d.movieDesc || "",
      metadata: (d.metadataArr || []).join(", "),
      criticsScore: d.criticsScore ? d.criticsScore.toString() : "",
      audienceScore: d.audienceScore ? d.audienceScore.toString() : ""
    }
  }));
  console.log(JSON.stringify(records));
        // const records = movieDatas.map((movieData, i) => ({
        //     id: `movie-${i}`,
        //     chunk_text: [
        //         movieData.movieTitle,
        //         movieData.movieDesc,
        //         movieData.criticsScore + "cricticsScore",
        //         movieData.audienceScore + "audienceScore",
        //       ].filter(Boolean).join(' | '),
        //     category: [
        //         ...(movieData.genres || []),
        //         ...(movieData.metadataArr || []),
        //       ].filter(Boolean).join(' | '),
        // }));

  return await index.namespace(`movies-crawled-data`).upsert(records);
}

/**
 * Dummy embedding function - replace with real embedding logic.
 * @param {object][]} movieDatas
 * @returns {object[]}
 */
async function embedMovies(movieDatas) {
    const model = config.modelName;
    let headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "api-key": config.pinecone,
      "x-pinecone-api-version": "2025-04",
    } 
    let data = {
      "model": model,
      "parameters": {
          "input_type": "passage",
          "truncate": 'END',
          "dimension": 768
      },
      "inputs": movieDatas.map((d) => ({
        "text": [
          d.movieTitle,
          ...(d.genres || []),
          d.movieDesc,
          ...(d.metadataArr || []),
          d.criticsScore,
          d.audienceScore
        ].filter(Boolean).join(' | ')
      }))
    }
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