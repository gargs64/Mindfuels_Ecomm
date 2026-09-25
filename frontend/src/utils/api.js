/**
 * Unified API URL resolution.
 *
 * In production builds (import.meta.env.PROD === true) the frontend is served
 * by the same Express backend, so all API calls should be relative (empty string).
 * In development, we read VITE_API_BASE_URL or default to http://localhost:5000.
 *
 * Every component should use this instead of computing the URL independently.
 */
export function getApiUrl() {
  if (import.meta.env.PROD) {
    return '';  // Same-origin — backend serves the built frontend
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
}

/**
 * Resilient fetch wrapper with automatic retry and exponential backoff.
 *
 * Retries on network errors AND 5xx / 429 status codes up to `maxRetries` times.
 * Returns the Response object on success, throws on unrecoverable failure.
 *
 * @param {string} url       — full URL to fetch
 * @param {object} options   — standard fetch options
 * @param {number} maxRetries — how many times to retry (default 2)
 * @returns {Promise<Response>}
 */
export async function resilientFetch(url, options = {}, maxRetries = 2) {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Retry on server errors and rate limiting
      if ((response.status >= 500 || response.status === 429) && attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Network request failed after retries');
}
