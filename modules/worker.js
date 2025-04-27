import { parentPort, workerData } from 'worker_threads';
import puppeteer from 'puppeteer';
import { upsertMovies } from '../core/db/pinecone-helper.js';

// Get the batch of URLs assigned to this worker
const { batch, workerId } = workerData;

async function processUrls() {
  console.log(`Worker ${workerId}: Started processing ${batch.length} URLs`);
  
  // Launch a browser instance for this worker
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const results = [];
  
  for (let i = 0; i < batch.length; i++) {
    const url = batch[i];
    try {
      console.log(`Worker ${workerId} (${i+1}/${batch.length}): 🔍 Crawling: ${url}`);
      
      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.waitForSelector('rt-text[slot="criticsScore"]', { timeout: 10000 });
      await page.waitForSelector('rt-text[slot="audienceScore"]', { timeout: 10000 });

      const data = await page.evaluate(() => {
        const getText = (selector) =>
          document.querySelector(selector)?.textContent?.trim() ?? 'N/A';

        const movieTitleEl = document.querySelector('rt-text[slot="title"]');
        const movieDescEl = document.querySelector('rt-text[slot="content"]');
        const movieMetadatas = document.querySelectorAll('rt-text[slot="metadataProp"]');
        const movieImageEl = document.querySelector('rt-img[slot="posterImage"]');

        const movieTitle = movieTitleEl?.textContent?.trim() ?? 'N/A';
        const movieDesc = movieDescEl?.textContent?.trim() ?? 'N/A';
        const metadataArr = Array.from(movieMetadatas).map(node =>
          node.textContent.trim().replace(/[\/,]/g, '')
        );
        const movieImage = movieImageEl?.getAttribute('src') ?? 'N/A';

        const genreNodes = document.querySelectorAll('rt-text[slot="metadataGenre"]');
        const genres = Array.from(genreNodes)
          .map(node => node.textContent.trim().replace(/\//g, ''));

        const criticsEl = document.querySelector('rt-text[slot="criticsScore"]');
        const audienceEl = document.querySelector('rt-text[slot="audienceScore"]');
        const criticsScore = criticsEl?.textContent?.trim() ?? 'N/A';
        const audienceScore = audienceEl?.textContent?.trim() ?? 'N/A';

        const criticReviews = getText('rt-link[slot="criticsReviews"]');
        const audienceVerifiedCount = getText('rt-link[slot="audienceReviews"]');

        const criticsConsensusEl = document.querySelector('#critics-consensus p');
        const audienceConsensusEl = document.querySelector('#audience-consensus p');

        const criticsConsensus = criticsConsensusEl?.textContent?.trim() ?? 'N/A';
        const audienceConsensus = audienceConsensusEl?.textContent?.trim() ?? 'N/A';

        const castEl = document.querySelector('div.category-wrap:nth-child(2)');
        const cast = castEl
        .textContent
        .split('\n')
        .map(text => text.trim())
        .filter(text => text && text != "Producer")
        .join(" ");
        
        return {
          movieTitle,
          movieDesc,
          movieImage,
          metadataArr,
          criticsScore: criticsScore === '' ? 'No Rating' : criticsScore,
          criticReviews: criticReviews === 'N/A' ? 'No Reviews' : criticReviews,
          audienceScore: audienceScore === '' ? 'No Rating' : audienceScore,
          audienceVerifiedCount: audienceVerifiedCount === 'N/A' ? 'No Reviews' : audienceVerifiedCount,
          criticsConsensus,
          audienceConsensus,
          cast,
          genres,
        };
      });
      
      // await page.goto(url + "/cast-and-crew", { waitUntil: 'networkidle2' });
      // await page.waitForSelector('section[data-adobe-id="cast-and-crew"]', { timeout: 10000 });
      // const castData = await page.evaluate(() => {
      //   const castNodes = document.querySelectorAll('cast-and-crew-card');
      //   const cast = Array.from(castNodes).map(node => {
      //     const name = node.querySelector('rt-text[slot="title"]')?.textContent?.trim() ?? 'N/A';
      //     return { name };
      //   });
        
      //   return cast;
      // });
      // results.push({ cast: castData });

      results.push({ url, ...data });
      
      // Throttle requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      console.error(`Worker ${workerId}: ❌ Error scraping ${url}:`, err.message);
      results.push({ url, error: err.message });
    }
  }
  await browser.close();
  await upsertMovies(results);
  console.log(`Worker ${workerId}: Completed processing ${batch.length} URLs`);
  
  // Send results back to the main thread
  parentPort.postMessage(results);
}

// Start processing
processUrls().catch(err => {
  console.error(`Worker ${workerId} failed:`, err);
  parentPort.postMessage([]); // Send empty result on failure
});