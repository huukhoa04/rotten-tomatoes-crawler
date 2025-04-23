import puppeteer from 'puppeteer';

/**
 * Extracts movie info from a Rotten Tomatoes movie page.
 * @param {puppeteer.Page} page
 * @param {string} url
 * @returns {Promise<object>}
 */
export async function extractMovieInfo(page, url) {
  await page.goto(url, { waitUntil: 'networkidle2' });
  await page.waitForSelector('rt-text[slot="criticsScore"]', { timeout: 10000 });
  await page.waitForSelector('rt-text[slot="audienceScore"]', { timeout: 10000 });

  return await page.evaluate(() => {
    const getText = (selector) =>
      document.querySelector(selector)?.textContent?.trim() ?? 'N/A';

    const movieTitleEl = document.querySelector('rt-text[slot="title"]');
    const movieMetadatas = document.querySelectorAll('rt-text[slot="metadataProp"]');
    const movieTitle = movieTitleEl?.textContent?.trim() ?? 'N/A';
    const metadataArr = Array.from(movieMetadatas).map(node =>
      node.textContent.trim().replace(/[\/,]/g, '')
    );

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
      metadataArr,
      criticsScore: criticsScore === '' ? 'No Rating' : criticsScore,
      criticReviews: criticReviews === 'N/A' ? 'No Reviews' : criticReviews,
      audienceScore: audienceScore === '' ? 'No Rating' : audienceScore,
      audienceVerifiedCount: audienceVerifiedCount === 'N/A' ? 'No Reviews' : audienceVerifiedCount,
      genres,
    };
  });
}