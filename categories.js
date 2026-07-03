// categories.js — Category detection

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