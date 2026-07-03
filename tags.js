// tags.js — Tag cleaning and validation

function cleanTags(tagsString) {
  if (!tagsString) return { tags: '', warning: false };
  
  let warning = false;
  const tagList = tagsString.split(',').map(tag => tag.trim().toLowerCase());
  
  const seen = [];
  const cleaned = tagList.filter(tag => {
    if (!tag) return false;
    
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