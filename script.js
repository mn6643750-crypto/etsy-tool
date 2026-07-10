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
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {

    document.querySelectorAll('.nav-tab').forEach(t =>
      t.classList.remove('active')
    );

    document.querySelectorAll('.tab-content').forEach(content =>
      content.classList.remove('active')
    );

    tab.classList.add('active');

    const target = document.getElementById(tab.dataset.tab);

    if (target) {
      target.classList.add('active');
    }
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
        const detectedCategory = detectCategory(productName, materials);

        alert(
  "TEXT:\n" + (productName + " " + materials) +
  "\n\nCATEGORY: " + detectedCategory
);

        const response = await fetch('/api/generate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 1500,
messages: [
  {
    role: 'system',
    content: getSystemPrompt(detectedCategory, selectedStyle)
  },
  {
    role: 'user',
    content: getUserPrompt(detectedCategory, productName, materials, keywords, selectedStyle)
  }
]
})
});

const data = await response.json();
if (data.error) {
  throw new Error(data.error);
}
if (!data?.choices?.[0]?.message?.content) {
  throw new Error('Invalid response from AI. Please try again.');
}
const rawContent = data.choices[0].message.content;

// Full debuglogging



const cleaned = rawContent.trim().replace(/\*\*/g, '').replace(/\*/g, '').trim();

const titleMatch = cleaned.match(/(?:SEO\s*TITLE|TITLE)[:\s]+([\s\S]*?)(?=(?:DESCRIPTION|DESC)[:\s]|$)/i);
const descMatch = cleaned.match(/(?:DESCRIPTION|DESC)[:\s]+([\s\S]*?)(?=(?:ETSY\s*TAGS|TAGS)[:\s]|$)/i);
const tagsMatch = cleaned.match(/(?:ETSY\s*TAGS|TAGS)[:\s]+([\s\S]*?)$/i);

const title = titleMatch ? titleMatch[1].trim() : '';
const desc = descMatch ? descMatch[1].trim() : '';
const tagsRaw = tagsMatch ? tagsMatch[1].trim() : '';

const { tags } = cleanTags(tagsRaw, productName, keywords, detectedCategory);



const errors = validateOutput(title, desc, tags);


if (errors.length > 0) {

   console.warn("Validation failed:", {
    errors,
    title,
    description: desc,
    tags
  });

  const retryResponse = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      max_tokens: 1500,
messages: [
  {
    role: 'system',
    content: getSystemPrompt(detectedCategory, selectedStyle)
  },
  {
    role: 'user',
    content: getUserPrompt(detectedCategory, productName, materials, keywords, selectedStyle)
  }
]
    })
  });
const retryData = await retryResponse.json();
if (retryData.error) {
  throw new Error(retryData.error);
}
if (!retryData?.choices?.[0]?.message?.content) {
  throw new Error('Invalid response from AI. Please try again.');
}
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

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 1500,
        messages: [
          {
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
          }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from AI.');
    }

analyzerText.innerHTML = formatAnalyzerOutput(
    data.choices[0].message.content
);

  } catch (error) {
    console.error(error);
    analyzerText.textContent =
      'Something went wrong. Please try again.';
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

// listner before
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.copy-btn');
  if (btn && btn.dataset.copy) {
    if (btn.classList.contains('copied')) return;
    navigator.clipboard
      .writeText(decodeURIComponent(btn.dataset.copy))
      .catch(err => console.error('Copy failed:', err));
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    btn.classList.add('copied');
    setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); }, 2000);
  }
});
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
document.addEventListener("click", function (e) {

  if (e.target.id !== "copyAnalysisBtn") return;

  navigator.clipboard.writeText(
    decodeURIComponent(e.target.dataset.copy)
  );

  e.target.textContent = "✅ Copied!";

  setTimeout(() => {

    e.target.textContent = "📋 Copy Analysis";

  }, 2000);

});