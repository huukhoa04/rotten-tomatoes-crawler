import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import puppeteer from 'puppeteer';
import os from 'os';

/**
 * Extracts movie info from a Rotten Tomatoes movie page
 * @param {puppeteer.Page} page
 * @param {string} url
 * @returns {Promise<object>}
 */
export async function extractMovieInfo(page, url) {
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

    return {
      movieTitle,
      movieDesc,
      movieImage,
      metadataArr,
      criticsScore: criticsScore === '' ? 'No Rating' : criticsScore,
      criticReviews: criticReviews === 'N/A' ? 'No Reviews' : criticReviews,
      audienceScore: audienceScore === '' ? 'No Rating' : audienceScore,
      audienceVerifiedCount: audienceVerifiedCount === 'N/A' ? 'No Reviews' : audienceVerifiedCount,
      genres,
    };
  });

  return data;
}

/**
 * Crawls a batch of movies in a worker thread
 * @param {string[]} movieUrls - Array of movie URLs to crawl
 * @returns {Promise<Array>} - Results from this batch
 */
export async function crawlMoviesInParallel(movieUrls) {
  if (movieUrls.length === 0) return [];
  
  // Use about 75% of available CPU cores for workers
  const numWorkers = 4;
  const batchSize = Math.ceil(movieUrls.length / numWorkers); // Number of URLs per worker thread
  console.log(`🧵 Using ${numWorkers} worker threads for ${movieUrls.length} movies (${batchSize} per worker)`);
  
  // Split the URLs into batches for each worker
  const batches = [];
  for (let i = 0; i < movieUrls.length; i += batchSize) {
    batches.push(movieUrls.slice(i, i + batchSize));
  }
  
  // Create promises for each worker
  const workerPromises = batches.map((batch, index) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./worker.js', import.meta.url), {
        workerData: { 
          batch,
          workerId: index + 1
        }
      });
      
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', code => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  });
  
  // Wait for all workers to complete
  const results = await Promise.all(workerPromises);
  // Flatten the results from all workers
  return results.flat();
}