/**
 * Extracts the movie slug from a Rotten Tomatoes detail link.
 * Example: "https://www.rottentomatoes.com/m/the_quintessential_quintuplets_movie"
 * returns: "the_quintessential_quintuplets_movie"
 * 
 * @param {string} url - The Rotten Tomatoes movie detail URL.
 * @returns {string|null} The movie slug, or null if not found.
 */
function getRottenTomatoesSlug(url) {
    try {
        const match = url.match(/\/m\/([^/?#]+)/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

export default getRottenTomatoesSlug;