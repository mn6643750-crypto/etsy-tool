function validateOutput(title, desc, tags, category = '') {
  const errors = [];

  if (!title || title.trim() === '') {
    errors.push('Title is missing');
  }

  if (!desc || desc.trim() === '') {
    errors.push('Description is missing');
  }

  const tagList = tags
    ? tags.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  if (tagList.length !== 13) {
    errors.push(`Expected 13 tags, got ${tagList.length}`);
  }

  const text = `${title} ${desc} ${tags}`.toLowerCase();

  // منع معلومات مختلقة شائعة
  const forbiddenPhrases = [
    '18 inches',
    'care instructions',
    'high resolution',
    'compatible with',
    'works with any',
    'burns cleanly'
  ];

  forbiddenPhrases.forEach(term => {
    if (text.includes(term)) {
      errors.push(`Forbidden phrase detected: ${term}`);
    }
  });

  // منع Tags من فئات مختلفة
  if (category === 'jewelry') {
    ['stacking ring', 'minimalist ring'].forEach(term => {
      if (text.includes(term)) {
        errors.push(`Invalid jewelry tag: ${term}`);
      }
    });
  }

  if (category === 'template') {
    ['ats resume'].forEach(term => {
      if (text.includes(term)) {
        errors.push(`Invalid template tag: ${term}`);
      }
    });
  }

  return errors;
}