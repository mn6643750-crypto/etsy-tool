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

let tags = tagsMatch ? tagsMatch[1].trim() : '';
let tagsWarning = false;

if (tags) {
  const tagList = tags.split(',').map(tag => tag.trim());
  const fixedTags = tagList.map(tag => {
    if (tag.length > 20) {
      tagsWarning = true;
      const words = tag.split(' ');
      let shortTag = '';
      for (const word of words) {
        if ((shortTag + (shortTag ? ' ' : '') + word).length <= 20) {
          shortTag += (shortTag ? ' ' : '') + word;
        } else {
          break;
        }
      }
      return shortTag || words[0].substring(0, 20);
    }
    return tag;
  });
  tags = fixedTags.join(', ');
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
        max_tokens: 2048,
        messages: [{
          role: 'user',
content: `You are an experienced Etsy seller who specializes in SEO-optimized product listings.

Generate an Etsy listing for this product:
Product: ${productName}
Materials/Details: ${materials}
Keywords: ${keywords}
Style: ${selectedStyle}

STRICT RULES:
1. Use ONLY the information provided. Do not invent features, materials, or specifications.
2. If information is missing, omit it. Never assume or infer.
3. Write like a real Etsy seller, not a generic AI.
4. Avoid phrases like: "Order now", "Our attention to detail", "elevate your style", "exquisite", "luxurious", "premium", "make a statement".

SEO TITLE RULES:
- Start with the most searched Etsy keyword for this product.
- Maximum 140 characters.
- Natural and keyword-rich, not stuffed.
- Do not add colors or details unless they add search value.

DESCRIPTION RULES:
- Focus on: what it is, materials, who it's for, and use cases.
- Sound like a real seller, not a marketing brochure.
- 120-150 words maximum.
- ${selectedStyle} tone.

ETSY TAGS RULES:
- Exactly 13 tags.
- CRITICAL: Every single tag MUST be 20 characters or less. Count every character including spaces.
- Before returning, count each tag's characters. If any tag is over 20 characters, replace it with a shorter version.
- NEVER use a tag over 20 characters. No exceptions.
- Use complete natural phrases only.
- Good examples (count the characters):
  "personalized gift" = 17 chars ✓
  "gift for dad" = 12 chars ✓
  "leather wallet" = 14 chars ✓
  "custom gift" = 11 chars ✓
- Bad examples:
  "personalized gifts for him" = 26 chars ✗ → use "gift for him" instead
  "fathers day gift ideas" = 22 chars ✗ → use "fathers day gift" instead
- Separate with commas.

Return EXACTLY in this format with no extra text:

SEO TITLE:
[title here]

DESCRIPTION:
[description here]

ETSY TAGS:
[tag1, tag2, tag3, ...]`
        }]
      })
    });

    const data = await response.json();
    outputText.innerHTML = formatOutput(data.choices[0].message.content);
    trackEvent('generation_success', {
  style: selectedStyle,
  duration_ms: Date.now() - startTime
});
    saveResult(productName, formatOutput(data.choices[0].message.content));

  } catch (error) {
    outputText.textContent = 'Something went wrong. Please try again.';
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