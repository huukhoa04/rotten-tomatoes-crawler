import puppeteer from 'puppeteer';
import fs from 'fs';
import { extractMovieInfo } from './modules/crawl.js';

const movies = [
  'https://www.rottentomatoes.com/m/dune_part_two',
  'https://www.rottentomatoes.com/m/oppenheimer_2023',
  'https://www.rottentomatoes.com/m/godzilla_x_kong_the_new_empire',
  'https://www.rottentomatoes.com/m/a_minecraft_movie',
  'https://www.rottentomatoes.com/m/gangers'
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  const results = [];

  for (const url of movies) {
    try {
      console.log(`🔍 Crawling: ${url}`);
      const data = await extractMovieInfo(page, url);
      results.push({ url, ...data });
      await new Promise(resolve => setTimeout(resolve, 2000)); // throttle requests
    } catch (err) {
      console.error(`❌ Error scraping ${url}:`, err);
      results.push({ url, error: err.message });
    }
  }

  await browser.close();

  console.log('\n🎬 Final Results:', results);
  fs.writeFileSync('rottentomatoes_results.json', JSON.stringify(results, null, 2));
})();