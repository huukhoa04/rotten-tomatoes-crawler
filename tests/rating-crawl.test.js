import puppeteer from 'puppeteer';
import fs from 'fs';

const movies = [
  'https://www.rottentomatoes.com/m/dune_part_two',
  'https://www.rottentomatoes.com/m/oppenheimer_2023',
  'https://www.rottentomatoes.com/m/godzilla_x_kong_the_new_empire',
  'https://www.rottentomatoes.com/m/a_minecraft_movie'
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  const results = [];

  for (const url of movies) {
    try {
      console.log(`🔍 Crawling: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2' });

      // Wait for the key elements
      await page.waitForSelector('rt-text[slot="criticsScore"]', { timeout: 10000 });
      await page.waitForSelector('rt-text[slot="audienceScore"]', { timeout: 10000 });
      await page.waitForSelector('rt-link[slot="audienceReviews"]', { timeout: 10000 });

      const data = await page.evaluate(() => {
        const getText = (selector) =>
          document.querySelector(selector)?.textContent?.trim() ?? 'N/A';

        // Extract all genres as an array
        const genreNodes = document.querySelectorAll('rt-text[slot="metadataGenre"]');
        const genres = Array.from(genreNodes).map(node => node.textContent.trim());
        const category = genres.length ? genres.join(', ') : 'N/A';

        return {
          criticsScore: getText('rt-text[slot="criticsScore"]'),
          criticReviews: getText('rt-link[slot="criticsReviews"]'),
          audienceScore: getText('rt-text[slot="audienceScore"]'),
          audienceVerifiedCount: getText('rt-link[slot="audienceReviews"]'),
          category, // Added category field
        };
      });

      results.push({ url, ...data });

      await new Promise(resolve => setTimeout(resolve, 2000));
    // throttle requests
    } catch (err) {
      console.error(`❌ Error scraping ${url}:`, err);
      results.push({ url, error: err.message });
    }
  }

  await browser.close();

  console.log('\n🎬 Final Results:', results);
  fs.writeFileSync('rottentomatoes_results.json', JSON.stringify(results, null, 2));
})();
