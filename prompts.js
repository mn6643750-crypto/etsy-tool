// prompts.js — Optimized prompt builders

function getCategoryPrompt(category, productName, materials, keywords, selectedStyle) {
  const base = `Product: ${productName}
Materials: ${materials}
Keywords: ${keywords}
Style: ${selectedStyle}`;

  const shared = `
STRICT RULES:
1. Use ONLY the information provided. Never invent: formats, materials, sizes, colors, audiences, occasions, software, or features not mentioned.
2. If a detail is missing, write around what you know. Never fill gaps.
3. Avoid: "Order now", "elevate", "exquisite", "luxurious", "premium", "stunning", "perfect for anyone", "high quality".
4. Write like a real Etsy seller — natural, clear, honest.

TAGS:
- Exactly 13 tags, all directly related to THIS product only.
- Each tag ≤ 20 characters.
- No duplicates or near-duplicates.
- Use real Etsy search phrases buyers use for this product.
- NEVER use tags from another niche or product category. This is a hard rule.
- Every tag must be directly supported by the current product's name, materials, or purpose.
- If a tag cannot be justified by this specific product, do not generate it.
- It is better to generate a less popular but relevant tag than a high-volume unrelated tag.
- Examples of forbidden cross-niche tags: never use "ats resume" for a wedding invitation, never use "ceramic mug" for a passport holder, never use planner tags for sewing patterns.

OUTPUT — return exactly this structure, nothing else:

SEO TITLE:
[title]

DESCRIPTION:
[description]

ETSY TAGS:
[tag1, tag2, tag3, tag4, tag5, tag6, tag7, tag8, tag9, tag10, tag11, tag12, tag13]`;

  const prompts = {
    svg: `You are an experienced Etsy seller specializing in SVG and digital cutting files.
${base}

TITLE: Start with the file type (SVG, SVG Bundle, etc.) then the design theme. Max 140 chars. Only mention formats explicitly provided.
DESCRIPTION: First sentence states what the product is. Only mention file formats and machine compatibility if explicitly provided. Describe what buyers can create based only on provided info. 100-130 words.
TAGS: Focus on design theme, file type, and craft use — based only on provided info.
${shared}`,

    template: `You are an experienced Etsy seller specializing in digital templates.
${base}

TITLE: Start with the template type. Include platform (Canva, Google Docs, etc.) only if explicitly provided. Max 140 chars.
DESCRIPTION: What the template is for. Mention included files, pages, or formats only if provided. Mention customization only if stated. 100-130 words.
TAGS: Focus on template type and use case — based only on provided info.
${shared}`,

    printable: `You are an experienced Etsy seller specializing in printable products.
${base}

TITLE: Start with the printable type. Max 140 chars.
DESCRIPTION: What it is and what it helps with. Mention file formats and sizes only if provided. 100-130 words.
TAGS: Focus on printable type and use case — based only on provided info.
${shared}`,

    jewelry: `You are an experienced Etsy seller specializing in handmade jewelry.
${base}

TITLE: Start with the jewelry type. Include material and style only if explicitly provided. Max 140 chars.
DESCRIPTION: What the piece is. Mention material and dimensions only if provided. 100-130 words.
TAGS: Focus on jewelry type and material — based only on provided info.
${shared}`,

    homedecor: `You are an experienced Etsy seller specializing in home decor.
${base}

TITLE: Start with product type and style. Max 140 chars.
DESCRIPTION: What it is. Mention material, dimensions, and room type only if provided. 100-130 words.
TAGS: Focus on product type and style — based only on provided info.
${shared}`,

    digital: `You are an experienced Etsy seller specializing in digital products.
${base}

TITLE: Start with the product type. Max 140 chars.
DESCRIPTION: What the product is. Mention included files and usage only if provided. 100-130 words.
TAGS: Focus on product type and use case — based only on provided info.
${shared}`,

    physical: `You are an experienced Etsy seller specializing in handmade physical products.
${base}

TITLE: Start with the primary Etsy search keyword. Include material only if provided. Max 140 chars.
DESCRIPTION: What it is. Mention material and dimensions only if provided. Mention who it suits only if clearly implied. 100-130 words. ${selectedStyle} tone.
TAGS: Focus on product type, material, and style — based only on provided info.
${shared}`
  };

  return prompts[category] || prompts.physical;
}