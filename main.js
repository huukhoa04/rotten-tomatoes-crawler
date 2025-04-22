import puppeteer from 'puppeteer';
import fs from 'fs';

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
      await page.goto(url, { waitUntil: 'networkidle2' });

      // Only wait for the main score elements (they may be empty, but should exist)
      await page.waitForSelector('rt-text[slot="criticsScore"]', { timeout: 10000 });
      await page.waitForSelector('rt-text[slot="audienceScore"]', { timeout: 10000 });

      const data = await page.evaluate(() => {
        const getText = (selector) =>
          document.querySelector(selector)?.textContent?.trim() ?? 'N/A';
        
        const genreNodes = document.querySelectorAll('rt-text[slot="metadataGenre"]');
        const genres = Array.from(genreNodes)
          .map(node => node.textContent.trim().replace(/\//g, '')); // Remove '/' characters
        const category = genres.length ? genres.join(', ') : 'N/A';

        const criticsEl = document.querySelector('rt-text[slot="criticsScore"]');
        const audienceEl = document.querySelector('rt-text[slot="audienceScore"]');

        const criticsScore = criticsEl?.textContent?.trim() ?? 'N/A';
        const audienceScore = audienceEl?.textContent?.trim() ?? 'N/A';

        const isCriticScoreEmpty = criticsEl?.classList.contains('critics-score-empty') || criticsScore === '- -';
        const isAudienceScoreEmpty = audienceEl?.classList.contains('audience-score-empty') || audienceScore === '- -';

        // These links may not exist if there are no reviews
        const criticReviews = getText('rt-link[slot="criticsReviews"]');
        const audienceVerifiedCount = getText('rt-link[slot="audienceReviews"]');

        return {
          criticsScore: isCriticScoreEmpty ? 'No Rating' : criticsScore,
          criticReviews: criticReviews === 'N/A' ? 'No Reviews' : criticReviews,
          audienceScore: isAudienceScoreEmpty ? 'No Rating' : audienceScore,
          audienceVerifiedCount: audienceVerifiedCount === 'N/A' ? 'No Reviews' : audienceVerifiedCount,
          isCriticScoreEmpty,
          isAudienceScoreEmpty,
          category,
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
