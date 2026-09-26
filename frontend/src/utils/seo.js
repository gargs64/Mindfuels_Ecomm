/**
 * Dynamic SEO Helper for Mindfuels SPA
 * Updates document title, meta description, and handles JSON-LD structured data.
 */

export function updatePageSEO({ title, description, keywords, canonicalUrl }) {
  if (title) {
    document.title = title;
    
    // Update OpenGraph & Twitter title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', title);
  }

  if (description) {
    let descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.setAttribute('content', description);
    }
    
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);

    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', description);
  }

  if (keywords) {
    let kwMeta = document.querySelector('meta[name="keywords"]');
    if (kwMeta) {
      kwMeta.setAttribute('content', keywords);
    }
  }

  if (canonicalUrl) {
    let canon = document.querySelector('link[rel="canonical"]');
    if (canon) {
      canon.setAttribute('href', canonicalUrl);
    }
  }
}

/**
 * Injects or updates a dynamic JSON-LD structured data script
 * @param {string} id Unique identifier for the script tag
 * @param {object} schemaData Schema.org JSON object
 */
export function setDynamicSchema(id, schemaData) {
  let existingScript = document.getElementById(id);
  if (existingScript) {
    existingScript.textContent = JSON.stringify(schemaData);
  } else {
    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schemaData);
    document.head.appendChild(script);
  }
}

/**
 * Removes a dynamic JSON-LD schema script when unmounting/closing
 * @param {string} id Unique identifier for the script tag
 */
export function removeDynamicSchema(id) {
  const existingScript = document.getElementById(id);
  if (existingScript) {
    existingScript.remove();
  }
}
