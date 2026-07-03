// formatter.js — Output formatting

function formatOutput(result) {
  const text = result.trim();
  const cleaned = text.replace(/\*\*/g, '').replace(/\*/g, '').trim();

  const titleMatch = cleaned.match(/(?:SEO\s*TITLE|TITLE)[:\s]+([\s\S]*?)(?=(?:DESCRIPTION|DESC)[:\s]|$)/i);
  const descMatch = cleaned.match(/(?:DESCRIPTION|DESC)[:\s]+([\s\S]*?)(?=(?:ETSY\s*TAGS|TAGS)[:\s]|$)/i);
  const tagsMatch = cleaned.match(/(?:ETSY\s*TAGS|TAGS)[:\s]+([\s\S]*?)$/i);

  const title = titleMatch ? titleMatch[1].trim() : '';
  const desc = descMatch ? descMatch[1].trim() : '';
  const tagsRaw = tagsMatch ? tagsMatch[1].trim() : '';
  const { tags, warning: tagsWarning } = cleanTags(tagsRaw);

  window.lastGenerated = { title, desc, tags };

  let html = '';

  if (title) html += `
    <div class="section-box">
      <h3>SEO TITLE</h3>
      <p class="section-content">${title}</p>
    </div>`;

  if (desc) html += `
    <div class="section-box">
      <h3>DESCRIPTION</h3>
      <p class="section-content">${desc.replace(/\n/g, '<br>')}</p>
    </div>`;

  if (tags) html += `
    <div class="section-box">
      <h3>ETSY TAGS</h3>
      <p class="section-content">${tags}</p>
      <p class="tags-validation ${tagsWarning ? 'warning' : 'success'}">
        ${tagsWarning ? '⚠️ Some tags exceeded Etsy\'s limit and were automatically shortened.' : '✅ All tags are optimized for Etsy (20 characters or less)'}
      </p>
    </div>`;

  if (html) {
    html += `<button class="copy-all-btn" id="copyAllBtn">📋 Copy All</button>`;
  } else {
    html = `<div class="section-box"><p class="section-content">${cleaned.replace(/\n/g, '<br>')}</p></div>`;
  }

  return html;
}