const DEBUG = false;

function debug(...args) {
  if (DEBUG) console.log('[DEBUG]', ...args);
}

function resetState() {
  window.lastGenerated = { title: '', desc: '', tags: '' };
}
const generateBtn = document.getElementById('generateBtn');

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

// Generator
generateBtn.addEventListener('click', async () => {
  const productName = document.getElementById('productName').value.trim();
  const materials = document.getElementById('materials').value.trim();
  const keywords = document.getElementById('keywords').value.trim();

  if (!productName) {
    outputText.textContent = 'Please enter a product name!';
    return;
  }
  resetState();
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

// Full debug logging
const detectedCategory = detectCategory(productName, materials);
const generatedPrompt = getCategoryPrompt(detectedCategory, productName, materials, keywords, selectedStyle);


const cleaned = rawContent.trim().replace(/\*\*/g, '').replace(/\*/g, '').trim();

const titleMatch = cleaned.match(/(?:SEO\s*TITLE|TITLE)[:\s]+([\s\S]*?)(?=(?:DESCRIPTION|DESC)[:\s]|$)/i);
const descMatch = cleaned.match(/(?:DESCRIPTION|DESC)[:\s]+([\s\S]*?)(?=(?:ETSY\s*TAGS|TAGS)[:\s]|$)/i);
const tagsMatch = cleaned.match(/(?:ETSY\s*TAGS|TAGS)[:\s]+([\s\S]*?)$/i);

const title = titleMatch ? titleMatch[1].trim() : '';
const desc = descMatch ? descMatch[1].trim() : '';
const tagsRaw = tagsMatch ? tagsMatch[1].trim() : '';
const detectedCategory = detectCategory(productName, materials);
const { tags } = cleanTags(tagsRaw, productName, keywords, detectedCategory);



const errors = validateOutput(title, desc, tags);


if (errors.length > 0) {

  const retryResponse = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: generatedPrompt
      }]
    })
  });
  const retryData = await retryResponse.json();
  
outputText.innerHTML = formatOutput(retryData.choices[0].message.content, productName, keywords, detectedCategory);
} else {
 outputText.innerHTML = formatOutput(rawContent, productName, keywords, detectedCategory);
}



 
saveResult(productName, outputText.innerHTML);
    trackEvent('generation_success', {
  style: selectedStyle,
  duration_ms: Date.now() - startTime
});
    

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