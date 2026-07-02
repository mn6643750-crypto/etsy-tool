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
content: `You are an experienced Etsy seller with deep knowledge of Etsy SEO and buyer psychology.

Your task is to generate a high-quality Etsy product listing based ONLY on the information provided below.

PRODUCT INFORMATION:
Product: ${productName}
Materials/Details: ${materials}
Keywords: ${keywords}
Tone/Style: ${selectedStyle}

ABSOLUTE RULES — NEVER BREAK THESE:
1. ONLY use information explicitly provided above.
2. NEVER invent or assume: gender, age, color, size, material, occasion, audience, or any feature not mentioned.
3. If information is missing, write around what you know. Do not fill gaps with assumptions.
4. NEVER use these phrases: "Order now", "Don't miss out", "Our attention to detail", "elevate your style", "exquisite", "luxurious", "premium quality", "make a statement", "perfect for anyone", "great gift idea".
5. Write like a real human Etsy seller, not a marketing robot.

SEO TITLE RULES:
- Start with the primary search keyword buyers would use on Etsy.
- Maximum 140 characters.
- Include 2-3 relevant keywords naturally.
- Do NOT stuff keywords or repeat words.
- Do NOT add details not provided by the user.

DESCRIPTION RULES:
- 120-150 words maximum.
- First sentence: what the product is and its main feature.
- Middle: materials, size, use cases, or personalization options (only if provided).
- End: who it suits or when to use it (only if clearly implied by the product).
- Tone: ${selectedStyle}.
- Sound like a real Etsy seller writing to a real buyer.

ETSY TAGS RULES:
- Generate exactly 13 tags.
- EVERY tag must be 20 characters or less. Count carefully.
- No duplicate tags or near-duplicates.
- Use phrases real buyers search for on Etsy.
- No generic tags like "great gift" or "high quality".
- Prioritize: product type, material, use case, occasion (only if provided), and style.

OUTPUT FORMAT — Return EXACTLY this structure, nothing else:

SEO TITLE:
[title]

DESCRIPTION:
[description]

ETSY TAGS:
[tag1, tag2, tag3, tag4, tag5, tag6, tag7, tag8, tag9, tag10, tag11, tag12, tag13]`
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