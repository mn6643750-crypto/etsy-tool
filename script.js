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
  
  const titleMatch = text.match(/\*{0,2}SEO TITLE\*{0,2}[:\s]+([\s\S]*?)(?=\*{0,2}DESCRIPTION\*{0,2}[:\s]|$)/i);
  const descMatch = text.match(/\*{0,2}DESCRIPTION\*{0,2}[:\s]+([\s\S]*?)(?=\*{0,2}ETSY TAGS\*{0,2}[:\s]|$)/i);
  const tagsMatch = text.match(/\*{0,2}ETSY TAGS\*{0,2}[:\s]+([\s\S]*?)$/i);

  const title = titleMatch ? titleMatch[1].trim() : '';
  const desc = descMatch ? descMatch[1].trim() : '';
  const tags = tagsMatch ? tagsMatch[1].trim() : '';

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
    </div>`;

  if (html) {
    html += `<button class="copy-all-btn" id="copyAllBtn">📋 Copy All</button>`;
  } else {
    html = `<div class="section-box"><p class="section-content">${text.replace(/\n/g, '<br>')}</p></div>`;
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
content: `Generate Etsy listing content for:
Product: ${productName}
Materials/Details: ${materials}
Keywords: ${keywords}
Style: ${selectedStyle}

IMPORTANT RULES:
1. Use ONLY the information provided by the user.
2. If a feature is not explicitly mentioned, do not include it.
3. Do not assume: durability, ergonomic benefits, adjustable angles, storage capacity, comfort, or performance.
4. Missing information should be omitted, not inferred.
5. Write in a natural Etsy seller style.
6. Avoid these phrases: "elevate your style", "exquisite", "luxurious", "premium accessory", "make a statement".
You MUST return all three sections. Use EXACTLY these headers:

SEO TITLE:
[Write an SEO-optimized Etsy title under 140 characters using the ${selectedStyle} style]

DESCRIPTION:
[Write a compelling 150-word product description in ${selectedStyle} style]

ETSY TAGS:
[Write exactly 13 comma-separated tags]`
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