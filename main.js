import puppeteer from 'puppeteer';
import fs from 'fs';
import { crawlMoviesInParallel, extractMovieInfo } from './modules/crawl.js';
import crawlInput from './constants/genres/index.js';
import ACTION from './constants/genres/action.genre.js';
import ANIME from './constants/genres/anime.genre.js';
import COMEDY from './constants/genres/comedy.genre.js';
import HORROR from './constants/genres/horror.genre.js';
import MUSIC from './constants/genres/music.genre.js';
import MYSTERY_N_THRILLER from './constants/genres/mystery-n-thriller.genre.js';
import ROMANCE from './constants/genres/romance.genre.js';
import SCIFI from './constants/genres/scifi.genre.js';
import SPORTS from './constants/genres/sports.genre.js';


const movies = 
ACTION;

(async () => {
  console.time('Total crawl time');
  
  try {
    // Process all movies in parallel using worker threads
    const results = await crawlMoviesInParallel(movies);
    
    console.log(`\n🎬 Crawled ${results.length} movies successfully`);
    console.timeEnd('Total crawl time');
    
    // Save to JSON
    fs.writeFileSync('rottentomatoes_results.json', JSON.stringify(results, null, 2));

    console.log('Pinecone upsert complete!');
    
  } catch (error) {
    console.error('Failed during execution:', error);
  }
})();