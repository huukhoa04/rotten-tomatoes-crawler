# TestCrawler

A Node.js project for crawling and extracting movie rating data from [Rotten Tomatoes](https://www.rottentomatoes.com/).

## Features

- Crawls movie pages to collect:
    - Critics score and review count
    - Audience score and verified ratings count
    - Movie genres/categories
- Outputs results to `rottentomatoes_results.json`
- Includes an Express API endpoint to fetch movie info on demand

## Project Structure

```
.
├── .gitignore
├── main.js                  # Main crawler script (Puppeteer)
├── package.json
├── README.md
├── rottentomatoes_results.json
├── server.js                # Express API server
└── tests/
        └── rating-crawl.test.js # Test crawler script
```

## Usage

### 1. Install dependencies

```bash
npm install
```

### 2. Run the crawler

```bash
npm run crawl
```

- Crawls a predefined list of movie URLs and saves results to `rottentomatoes_results.json`.

### 3. Start the API server

```bash
npm run api
```

- Starts an Express server at `http://localhost:3000`.
- Endpoint: `/api/get-movie-info?movie=<movie-slug>`
    - Example: `/api/get-movie-info?movie=dune_part_two`

### 4. Run test script

```bash
node tests/rating-crawl.test.js
```

## Dependencies

- [puppeteer](https://www.npmjs.com/package/puppeteer)
- [express](https://www.npmjs.com/package/express)

## Notes

- The crawler uses Puppeteer in headless mode.
- Throttling is applied between requests to avoid overloading the target site.
- Results are saved in JSON format for further analysis.

