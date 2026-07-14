// formatter.js — Output formatting

const COPY_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

function renderTagChips(tagsString) {
  if (!tagsString) return '';

  return tagsString
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
    .map(tag => `
      <span
        class="tag-chip"
        data-tag="${encodeURIComponent(tag)}"
        title="Click to copy"
      >
        ${tag}
      </span>
    `)
    .join('');
}

function formatOutput(result, productName = '', keywords = '', category = 'physical') {
  const text = result.trim();
  const cleaned = text.replace(/\*\*/g, '').replace(/\*/g, '').trim();

  const titleMatch = cleaned.match(/(?:SEO\s*TITLE|TITLE)[:\s]+([\s\S]*?)(?=(?:DESCRIPTION|DESC)[:\s]|$)/i);
  const descMatch = cleaned.match(/(?:DESCRIPTION|DESC)[:\s]+([\s\S]*?)(?=(?:ETSY\s*TAGS|TAGS)[:\s]|$)/i);
  const tagsMatch = cleaned.match(/(?:ETSY\s*TAGS|TAGS)[:\s]+([\s\S]*?)$/i);

  const title = titleMatch ? titleMatch[1].trim() : '';
  const desc = descMatch ? descMatch[1].trim() : '';
  const tagsRaw = tagsMatch ? tagsMatch[1].trim() : '';
  const { tags, warning: tagsWarning } = cleanTags(tagsRaw, productName, keywords, category);

  window.lastGenerated = { title, desc, tags };

  let html = '';

  if (title) html += `
    <div class="section-box">
      <div class="section-header">
        <h3>📄 SEO Title</h3>
        <button class="copy-btn" data-copy="${encodeURIComponent(title)}" title="Copy">${COPY_ICON}</button>
      </div>
      <p class="section-content title-text">${title}</p>
    </div>`;

  if (desc) html += `
    <div class="section-box">
      <div class="section-header">
        <h3>📝 Description</h3>
        <button class="copy-btn" data-copy="${encodeURIComponent(desc)}" title="Copy">${COPY_ICON}</button>
      </div>
      <p class="section-content desc-text">${desc.replace(/\n/g, '<br>')}</p>
    </div>`;

  if (tags) html += `
    <div class="section-box">
      <div class="section-header">
        <h3>🏷 Etsy Tags</h3>
        <button class="copy-btn" data-copy="${encodeURIComponent(tags)}" title="Copy">${COPY_ICON}</button>
      </div>
      <div class="tag-chips">${renderTagChips(tags)}</div>
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
function formatAnalyzerOutput(result) {
  if (!result) return "";

  const cleaned = result
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .trim();

const scoreMatch = cleaned.match(/(\d+)\s*\/\s*100/i);

  const strengthsMatch = cleaned.match(
    /STRENGTHS?\s*:?\s*([\s\S]*?)(?=WEAKNESSES?:|IMPROVEMENTS?:|$)/i
  );

  const weaknessesMatch = cleaned.match(
    /WEAKNESSES?\s*:?\s*([\s\S]*?)(?=IMPROVEMENTS?:|$)/i
  );

  const improvementsMatch = cleaned.match(
    /IMPROVEMENTS?\s*:?\s*([\s\S]*)$/i
  );

 const score = scoreMatch
  ? `${scoreMatch[1]}/100`
  : "N/A";
  const numericScore = parseInt(score) || 0;

let scoreColor = "#d32f2f";

if (numericScore >= 80) {
  scoreColor = "#2e7d32";
} else if (numericScore >= 60) {
  scoreColor = "#f9a825";
}
//summary
let summary = "";

if (numericScore >= 90) {
  summary =
    "Excellent listing. Only minor improvements are recommended.";
} else if (numericScore >= 70) {
  summary =
    "Your listing is strong but there is still room for optimization.";
} else if (numericScore >= 50) {
  summary =
    "Your listing has a solid foundation but needs stronger SEO optimization.";
} else {
  summary =
    "Your listing requires significant SEO improvements to become competitive.";
}

function renderList(text) {
  if (!text) return "<li>No data available.</li>";

  const items = text
    .split(/\n+/)
    .map(line =>
      line
        .replace(/^\d+\.\s*/, "")        // Remove numbering مثل 1. 2. 3.
        .replace(/^[✓✔✗❌•*-]\s*/, "")    // Remove bullets/icons
        .trim()
    )
    .filter(Boolean);

  return items
    .map(item => `<li>${item}</li>`)
    .join("");
}

  return `
    <div class="section-box">
      <div class="section-header">
        <h3>SEO Score</h3>
      </div>
        <p
           class="analysis-score"
           style="color:${scoreColor};">
            ${score}
        </p>
        <div class="analysis-progress">
  <div
    class="analysis-progress-fill"
    style="
      width:${numericScore}%;
      background:${scoreColor};
    ">
  </div>
</div>
        
        
        
      
    </div>

    <div class="section-box">
      <div class="section-header">
        <h3>Strengths</h3>
      </div>
      <ul class="section-content">
        ${renderList(strengthsMatch?.[1])}
      </ul>
    </div>

    <div class="section-box">
      <div class="section-header">
        <h3>Weaknesses</h3>
      </div>
      <ul class="section-content">
        ${renderList(weaknessesMatch?.[1])}
      </ul>
    </div>

    <div class="section-box">
      <div class="section-header">
        <h3>Improvements</h3>
      </div>
      <ul class="section-content">
        ${renderList(improvementsMatch?.[1])}
      </ul>
    </div>
    <div class="section-box">
  <div class="section-header">
    <h3>Summary</h3>
  </div>

    <p class="section-content">
      ${summary}
    </p>
  </div>

  <button
    class="copy-analysis-btn"
    id="copyAnalysisBtn"
    data-copy="${encodeURIComponent(cleaned)}">

    📋 Copy Analysis

  </button>
  `;
}