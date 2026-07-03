// validator.js — Output validation

function validateOutput(title, desc, tags) {
  const errors = [];
  if (!title || title.trim() === '') errors.push('Title is missing');
  if (!desc || desc.trim() === '') errors.push('Description is missing');
  const tagList = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];
  if (tagList.length !== 13) errors.push(`Expected 13 tags, got ${tagList.length}`);
  return errors;
}