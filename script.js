const generateBtn = document.getElementById('generateBtn');
// Analytics Helper
function trackEvent(eventName, params = {}) {
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, {
      timestamp: new Date().toISOString(),
      ...params
    });
  }
}
const analyzeBtn = document.getElementById('analyzeBtn');
const outputText = document.getElementById('outputText');
const analyzerText = document.getElementById('analyzerText');
let selectedStyle = 'Professional';


// Tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// Style buttons
document.querySelectorAll('.style-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedStyle = btn.dataset.style;
  });
});
//  format output
function formatOutput(result) {
  const text = result.trim();
  const cleaned = text.replace(/\*\*/g, '').replace(/\*/g, '').trim();
  
const titleMatch = cleaned.match(/SEO TITLE[:\s]+([\s\S]*?)(?=DESCRIPTION[:\s]|$)/i);
const descMatch = cleaned.match(/DESCRIPTION[:\s]+([\s\S]*?)(?=ETSY TAGS[:\s]|$)/i);
const tagsMatch = cleaned.match(/ETSY TAGS[:\s]+([\s\S]*?)$/i);

  const title = titleMatch ? titleMatch[1].trim() : '';
  const desc = descMatch ? descMatch[1].trim() : '';

let tagsWarning = false;
let tags = '';

if (tagsMatch) {
  const { tags: cleanedTags, warning } = cleanTags(tagsMatch[1].trim());
  tags = cleanedTags;
  tagsWarning = warning;
}
  // Store for Copy All
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
// Category Detection
function detectCategory(productName, materials) {
  const text = (productName + ' ' + materials).toLowerCase();
  
  if (text.match(/svg|cricut|silhouette|dxf|cutting/)) return 'svg';
  if (text.match(/template|canva|editable|powerpoint|word doc/)) return 'template';
  if (text.match(/printable|print at home|digital download|pdf|jpeg|png|instant download/)) return 'printable';
  if (text.match(/ring|necklace|bracelet|earring|pendant|jewelry|jewellery/)) return 'jewelry';
  if (text.match(/wall art|poster|print|decor|hanging|canvas|frame/)) return 'homedecor';
  if (text.match(/digital|download|file|pattern|ebook|guide|course/)) return 'digital';
  return 'physical';
}
// Tag Deduplication and Validation
function cleanTags(tagsString) {
  if (!tagsString) return { tags: '', warning: false };
  
  let warning = false;
  const tagList = tagsString.split(',').map(tag => tag.trim().toLowerCase());

  // Validate output
function validateOutput(title, desc, tags) {
  const errors = [];
  if (!title || title.trim() === '') errors.push('Title is missing');
  if (!desc || desc.trim() === '') errors.push('Description is missing');
  const tagList = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];
  if (tagList.length !== 13) errors.push(`Expected 13 tags, got ${tagList.length}`);
  return errors;
}
  
  // Remove duplicates and near-duplicates
  const seen = [];
  const cleaned = tagList.filter(tag => {
    if (!tag) return false;
    
    // Check length
    if (tag.length > 20) {
      warning = true;
      const words = tag.split(' ');
      let shortTag = '';
      for (const word of words) {
        if ((shortTag + (shortTag ? ' ' : '') + word).length <= 20) {
          shortTag += (shortTag ? ' ' : '') + word;
        } else break;
      }
      tag = shortTag || words[0].substring(0, 20);
    }
    
    // Check for near-duplicates (same words in different order)
    const tagWords = tag.split(' ').sort().join(' ');
    if (seen.includes(tagWords)) return false;
    seen.push(tagWords);
    return true;
  });
  
  return {
    tags: cleaned.join(', '),
    warning
  };
}

// Category Prompts
function getCategoryPrompt(category, productName, materials, keywords, selectedStyle) {
  const base = `Product: ${productName}
Materials/Details: ${materials}
Keywords: ${keywords}
Style: ${selectedStyle}`;

  const shared = `
ABSOLUTE RULES:
1. ONLY use information explicitly provided. NEVER invent details.
2. NEVER assume: gender, age, color, size, material, occasion, or audience unless stated.
3. NEVER use: "Order now", "Don't miss out", "attention to detail", "elevate", "exquisite", "luxurious", "premium", "perfect for anyone", "great gift".
4. Write like a real experienced Etsy seller.
5. Every tag MUST be 20 characters or less. No exceptions.
6. Generate exactly 13 unique tags with no duplicates.

OUTPUT FORMAT — Return EXACTLY this, nothing else:

SEO TITLE:
[title]

DESCRIPTION:
[description]

ETSY TAGS:
[tag1, tag2, tag3, tag4, tag5, tag6, tag7, tag8, tag9, tag10, tag11, tag12, tag13]`;
const tagRules = `
TAG QUALITY RULES:
- Use high-volume Etsy search terms only.
- NEVER repeat the same words in different order (example: "planner printable" and "printable planner" are duplicates — choose ONE).
- NEVER use generic weak tags like "organizer", "nice", "beautiful", "item".
- Double-check spelling before returning.
- Each tag must be a real phrase buyers type into Etsy search.
- Prefer specific over generic: "weekly planner" beats "planner".`;

  const prompts = {
    svg: `You are an expert Etsy seller specializing in SVG and cutting files.

${base}

TITLE: Start with the file type (SVG, SVG Bundle, etc.) then the design name. Max 140 chars.
DESCRIPTION: 
- First line: what files are included (SVG, PNG, DXF, EPS etc.)
- Mention compatible machines only if stated (Cricut, Silhouette)
- Explain what the buyer can make with it
- 100-130 words
TAGS: Focus on: file format, machine compatibility, design style, use case, craft type
${tagRules}
${shared}`,

    template: `You are an expert Etsy seller specializing in digital templates.

${base}

TITLE: Start with the template type. Include platform (Canva, Google Docs etc.) if provided. Max 140 chars.
DESCRIPTION:
- What the template is for
- What's included (number of slides/pages, formats)
- How to customize it
- Who it's for (only if clear from the product)
- 100-130 words
TAGS: Focus on: template type, platform, use case, industry, format
${tagRules}
${shared}`,

    printable: `You are an expert Etsy seller specializing in printable products.

${base}

TITLE: Start with the printable type. Max 140 chars.
DESCRIPTION:
- What it is and what it helps with
- File formats and sizes included
- How to use it (print at home, local print shop)
- 100-130 words
TAGS: Focus on: printable type, use case, format, size, occasion (only if provided)
${tagRules}
${shared}`,

    jewelry: `You are an expert Etsy seller specializing in handmade jewelry.

${base}

TITLE: Start with the jewelry type. Include material and style if provided. Max 140 chars.
DESCRIPTION:
- What it is and the material
- Size or dimensions (only if provided)
- Style and when to wear it (only if implied)
- 100-130 words
TAGS: Focus on: jewelry type, material, style, occasion (only if provided), gift use
${tagRules}
${shared}`,

    homedecor: `You are an expert Etsy seller specializing in home decor.

${base}

TITLE: Start with the product type and style. Max 140 chars.
DESCRIPTION:
- What it is and the material
- Size or dimensions (only if provided)
- Where to use it and how it looks
- 100-130 words
TAGS: Focus on: product type, style, room type, material, occasion (only if provided)
${tagRules}
${shared}`,

    digital: `You are an expert Etsy seller specializing in digital products.

${base}

TITLE: Start with the product type. Max 140 chars.
DESCRIPTION:
- What the digital product is
- What's included in the download
- How the buyer uses it
- 100-130 words
TAGS: Focus on: product type, use case, format, topic, audience (only if stated)
${tagRules}
${shared}`,

    physical: `You are an expert Etsy seller specializing in handmade physical products.

${base}

TITLE: Start with the main Etsy search keyword. Max 140 chars.
DESCRIPTION:
- What it is and the material (only what's provided)
- How it's made or used (only if provided)
- Who it suits (only if clearly implied)
- 100-130 words. ${selectedStyle} tone.
TAGS: Focus on: product type, material, style, use case, occasion (only if provided)
${tagRules}
${shared}`
  };

  return prompts[category] || prompts.physical;
}
// Generator
generateBtn.addEventListener('click', async () => {
  const productName = document.getElementById('productName').value.trim();
  const materials = document.getElementById('materials').value.trim();
  const keywords = document.getElementById('keywords').value.trim();

  if (!productName) {
    outputText.textContent = 'Please enter a product name!';
    return;
  }
  const startTime = Date.now();
  trackEvent('generate_clicked', { style: selectedStyle });
  generateBtn.disabled = true;
  generateBtn.textContent = '⏳ Generating...';
  outputText.innerHTML = 'Generating your content...';

  try {
        const response = await fetch('/api/generate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 3000,
messages: [{
  role: 'user',
  content: getCategoryPrompt(
    detectCategory(productName, materials),
    productName,
    materials,
    keywords,
    selectedStyle
  )
}]
})
});

const data = await response.json();
const rawContent = data.choices[0].message.content;
const cleaned = rawContent.trim().replace(/\*\*/g, '').replace(/\*/g, '').trim();

const titleMatch = cleaned.match(/SEO TITLE[:\s]+([\s\S]*?)(?=DESCRIPTION[:\s]|$)/i);
const descMatch = cleaned.match(/DESCRIPTION[:\s]+([\s\S]*?)(?=ETSY TAGS[:\s]|$)/i);
const tagsMatch = cleaned.match(/ETSY TAGS[:\s]+([\s\S]*?)$/i);

const title = titleMatch ? titleMatch[1].trim() : '';
const desc = descMatch ? descMatch[1].trim() : '';
const tagsRaw = tagsMatch ? tagsMatch[1].trim() : '';
const { tags } = cleanTags(tagsRaw);

const errors = validateOutput(title, desc, tags);

if (errors.length > 0) {
  // Retry once
  const retryResponse = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      max_tokens: 3000,
      messages: [{
        role: 'user',
      content: (() => {
        const category = detectCategory(productName, materials);
        const prompt = getCategoryPrompt(category, productName, materials, keywords, selectedStyle);
        console.log('Detected category:', category);
        console.log('Generated prompt:', prompt);
        return prompt;
      })()
      }]
    })
  });
  const retryData = await retryResponse.json();
  outputText.innerHTML = formatOutput(retryData.choices[0].message.content);
} else {
  outputText.innerHTML = formatOutput(rawContent);
}
saveResult(productName, outputText.innerHTML);
    trackEvent('generation_success', {
  style: selectedStyle,
  duration_ms: Date.now() - startTime
});
    saveResult(productName, formatOutput(data.choices[0].message.content));

} catch (error) {
    console.error('Generation error:', error);
    outputText.textContent = 'Something went wrong. Please try again. Error: ' + error.message;
    trackEvent('generation_failed', {
      style: selectedStyle,
      duration_ms: Date.now() - startTime
    });
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = '✨ Generate';
  }
});

// Analyzer
analyzeBtn.addEventListener('click', async () => {
  const competitorText = document.getElementById('competitorText').value.trim();

  if (!competitorText) {
    analyzerText.textContent = 'Please paste a competitor description!';
    return;
  }

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = '⏳ Analyzing...';
  analyzerText.innerHTML = 'Analyzing...';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{
          role: 'user',
          content: `Analyze this Etsy product description and return EXACTLY in this format:

SEO SCORE:
[X/100]

STRENGTHS:
[List 3 strengths with ✓]

WEAKNESSES:
[List 3 weaknesses with ✗]

IMPROVEMENTS:
[List 3 specific improvements]

Description to analyze:
${competitorText}`
        }]
      })
    });

    const data = await response.json();
    analyzerText.innerHTML = formatOutput(data.choices[0].message.content);

  } catch (error) {
    analyzerText.textContent = 'Something went wrong. Please try again.';
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = '🔍 Analyze';
  }
});
// Save & Dashboard
function saveResult(productName, content) {
  const saved = JSON.parse(localStorage.getItem('etsySaved') || '[]');
  saved.unshift({
    id: Date.now(),
    productName,
    content,
    date: new Date().toLocaleDateString()
  });
  localStorage.setItem('etsySaved', JSON.stringify(saved));
  renderDashboard();
}

function renderDashboard() {
  const saved = JSON.parse(localStorage.getItem('etsySaved') || '[]');
  const container = document.getElementById('savedListings');
  
  if (saved.length === 0) {
    container.innerHTML = '<p class="empty-msg">No saved listings yet. Generate content and save it!</p>';
    return;
  }

  container.innerHTML = saved.map(item => `
    <div class="saved-item">
      <div class="saved-item-header">
        <span class="saved-item-title">${item.productName}</span>
        <div>
          <span class="saved-item-date">${item.date}</span>
          <button class="delete-btn" onclick="deleteItem(${item.id})">🗑️</button>
        </div>
      </div>
      <div>${item.content}</div>
    </div>
  `).join('');
}

function deleteItem(id) {
  let saved = JSON.parse(localStorage.getItem('etsySaved') || '[]');
  saved = saved.filter(item => item.id !== id);
  localStorage.setItem('etsySaved', JSON.stringify(saved));
  renderDashboard();
}

document.getElementById('clearAllBtn').addEventListener('click', () => {
  localStorage.clear();
  renderDashboard();
});

renderDashboard();
// Copy All
document.addEventListener('click', function(e) {
  if (e.target.id === 'copyAllBtn') {
    const { title, desc, tags } = window.lastGenerated || {};
    const copyText = `Title:\n${title}\n\nDescription:\n${desc}\n\nTags:\n${tags}`;
    navigator.clipboard.writeText(copyText);
    
    const btn = e.target;
    btn.textContent = '✅ Copied to clipboard!';
    setTimeout(() => btn.textContent = '📋 Copy All', 2000);
    
    trackEvent('copy_all_clicked');
  }
});