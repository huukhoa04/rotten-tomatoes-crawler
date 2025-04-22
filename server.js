import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const PORT = 3000;

app.get('/api/get-movie-info', async (req, res) => {
  const url = `https://www.rottentomatoes.com/m/` + req.query.movie;
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

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

    res.json({ url, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
