// tags.js — Professional Etsy Tags Engine

const WEAK_SINGLE_WORDS = new Set([
  'weekly', 'daily', 'monthly', 'planner', 'pdf', 'printable', 'digital',
  'template', 'file', 'files', 'download', 'print', 'svg', 'png', 'jpg',
  'bundle', 'pack', 'set', 'kit', 'design', 'art', 'craft', 'item',
  'product', 'gift', 'nice', 'cute', 'pretty', 'beautiful', 'stunning',
  'perfect', 'great', 'good', 'best', 'top', 'new', 'custom', 'unique'
]);

// Normalize a single tag
function normalizeTag(tag) {
  return tag
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/^\d+[\.\)]\s*/, '')
    .replace(/^[-•*]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if tag is valid
function isValidTag(tag) {
  if (!tag || tag.length === 0) return false;
  if (tag.length > 20) return false;
  if (WEAK_SINGLE_WORDS.has(tag)) return false;
  if (tag.split(' ').length === 1 && tag.length < 4) return false;
  return true;
}

// Check if two tags are near-duplicates
function areNearDuplicates(tag1, tag2) {
  const words1 = tag1.split(' ').sort().join(' ');
  const words2 = tag2.split(' ').sort().join(' ');
  if (words1 === words2) return true;
  
  // Check if one contains all words of the other
  const set1 = new Set(tag1.split(' '));
  const set2 = new Set(tag2.split(' '));
  const intersection = [...set1].filter(w => set2.has(w));
  if (intersection.length === Math.min(set1.size, set2.size) && Math.min(set1.size, set2.size) > 1) {
    return true;
  }
  return false;
}

// Shorten a tag to fit within 20 chars
function shortenTag(tag) {
  if (tag.length <= 20) return tag;
  const words = tag.split(' ');
  let result = '';
  for (const word of words) {
    const candidate = result ? result + ' ' + word : word;
    if (candidate.length <= 20) {
      result = candidate;
    } else {
      break;
    }
  }
  return result || words[0].substring(0, 20);
}

// Generate fallback tags from product info
function generateFallbackTags(productName, keywords, category) {
  const fallbacks = [];
  
  const productWords = productName.toLowerCase().split(' ').filter(w => w.length > 3);
  const keywordList = keywords.toLowerCase().split(',').map(k => k.trim()).filter(k => k.length > 3);
  
  // Category-based fallbacks
  const categoryFallbacks = {
    svg: ['svg cut file', 'cricut svg', 'silhouette cut', 'diy craft svg', 'svg download'],
    template: ['editable template', 'instant download', 'digital template', 'canva template', 'printable template'],
    printable: ['printable pdf', 'instant download', 'print at home', 'digital print', 'printable art'],
    jewelry: ['handmade jewelry', 'minimalist jewelry', 'dainty jewelry', 'gift for her', 'jewelry gift'],
    homedecor: ['home decor', 'wall decor', 'room decor', 'boho decor', 'modern decor'],
    digital: ['digital download', 'instant download', 'digital file', 'printable file', 'digital art'],
    physical: ['handmade gift', 'unique gift', 'handcrafted', 'artisan made', 'gift idea']
  };
  
  const catFallbacks = categoryFallbacks[category] || categoryFallbacks.physical;
  fallbacks.push(...catFallbacks);
  
  // Add keyword combinations
  for (const kw of keywordList.slice(0, 3)) {
    if (kw.length <= 20 && !WEAK_SINGLE_WORDS.has(kw)) {
      fallbacks.push(kw);
    }
  }
  
  // Add product name combinations
  if (productWords.length >= 2) {
    const combo = productWords.slice(0, 2).join(' ');
    if (combo.length <= 20) fallbacks.push(combo);
  }
  
  return fallbacks;
}

// Rank tags by quality
function rankTags(tags) {
  return tags.sort((a, b) => {
    const scoreA = getTagScore(a);
    const scoreB = getTagScore(b);
    return scoreB - scoreA;
  });
}

function getTagScore(tag) {
  let score = 0;
  const wordCount = tag.split(' ').length;
  
  // Multi-word tags are better
  if (wordCount >= 2) score += 2;
  if (wordCount >= 3) score += 1;
  
  // Longer meaningful tags are better
  if (tag.length >= 10) score += 1;
  if (tag.length >= 15) score += 1;
  
  // Penalize weak single words
  if (wordCount === 1 && WEAK_SINGLE_WORDS.has(tag)) score -= 5;
  
  return score;
}

// Main Tags Engine
function cleanTags(tagsString, productName = '', keywords = '', category = 'physical') {
  if (!tagsString) return { tags: '', warning: false };
  
  let warning = false;
  
  // Parse and normalize all tags
  let tagList = tagsString
    .split(',')
    .map(tag => normalizeTag(tag))
    .filter(tag => tag.length > 0);
  
  // Shorten tags that exceed 20 chars
  tagList = tagList.map(tag => {
    if (tag.length > 20) {
      warning = true;
      return shortenTag(tag);
    }
    return tag;
  });
  
  // Remove duplicates and near-duplicates
  const deduped = [];
  for (const tag of tagList) {
    const isDuplicate = deduped.some(existing => areNearDuplicates(existing, tag));
    if (!isDuplicate) deduped.push(tag);
  }
  
  // Filter valid tags
  let validTags = deduped.filter(tag => isValidTag(tag));
  
  // Rank by quality
  validTags = rankTags(validTags);
  
  // If more than 13, keep best 13
  if (validTags.length > 13) {
    validTags = validTags.slice(0, 13);
  }
  
  // If fewer than 13, add fallbacks
  if (validTags.length < 13) {
    warning = true;
    const fallbacks = generateFallbackTags(productName, keywords, category);
    
    for (const fallback of fallbacks) {
      if (validTags.length >= 13) break;
      const normalized = normalizeTag(fallback);
      if (!normalized || normalized.length > 20) continue;
      if (!isValidTag(normalized)) continue;
      const isDuplicate = validTags.some(existing => areNearDuplicates(existing, normalized));
      if (!isDuplicate) {
        validTags.push(normalized);
      }
    }
  }
  
  return {
    tags: validTags.join(', '),
    warning: warning || validTags.length !== 13
  };
}