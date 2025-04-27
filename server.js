import express from 'express';
import puppeteer from 'puppeteer';
import { extractMovieInfo } from './modules/crawl.js';

const app = express();
const PORT = 3000;

app.get('/api/get-movie-info', async (req, res) => {
  const url = 'https://www.rottentomatoes.com/m/' + req.query.movie;
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    const data = await extractMovieInfo(page, url);

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
