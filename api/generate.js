async function callGemini(messages) {
  const system =
    messages.find(m => m.role === "system")?.content || "";

  const user =
    messages.find(m => m.role === "user")?.content || "";

  const prompt = `${system}\n\n${user}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini request failed");
  }

  return {
    choices: [
      {
        message: {
          content:
            data.candidates?.[0]?.content?.parts?.[0]?.text || ""
        }
      }
    ]
  };
}
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, model, max_tokens } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request: messages array is required' });
  }

  try {
const requestBody = {
  model: model || 'llama-3.1-8b-instant',
  max_tokens: max_tokens ?? 1500,
  messages
};

console.log('=== GROQ REQUEST INSPECTION ===');
console.log('model:', requestBody.model);
console.log('max_tokens:', requestBody.max_tokens);
console.log('messages.length:', requestBody.messages.length);
requestBody.messages.forEach((msg, i) => {
  console.log(`messages[${i}].role:`, msg.role);
  console.log(`messages[${i}].content.length (chars):`, msg.content.length);
});
console.log('total JSON body length (chars):', JSON.stringify(requestBody).length);
console.log('================================');

const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
  },
  body: JSON.stringify(requestBody)
});

const data = await response.json();

// لو Groq رجع Rate Limit أو Server Error
if (!response.ok) {

  console.error('Groq API error:', {
    status: response.status,
    statusText: response.statusText,
    body: data
  });

   if ([429, 500, 502, 503, 504].includes(response.status)) {

    console.log("Switching to Gemini fallback...");

    try {

      const geminiData = await callGemini(messages);

      console.log("Gemini fallback succeeded.");

      return res.status(200).json(geminiData);

    } catch (geminiError) {

      console.error("Gemini fallback failed:", geminiError);

      return res.status(response.status).json({
        error: data?.error?.message || `Groq API returned ${response.status}`,
        details: data
      });

    }

  }

  return res.status(response.status).json({
    error: data?.error?.message || `Groq API returned ${response.status}`,
    details: data
  });

}

    // Validate response structure
    if (!data?.choices?.[0]?.message?.content) {
      console.error('Groq API unexpected response structure:', data);
      return res.status(500).json({
        error: 'Groq API returned an unexpected response format',
        details: data
      });
    }

   if (data.usage) {
  console.log('Groq token usage:', {
    prompt_tokens: data.usage.prompt_tokens,
    completion_tokens: data.usage.completion_tokens,
    total_tokens: data.usage.total_tokens
  });
}

return res.status(200).json(data);
  } catch (error) {
    console.error('Generate handler error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
}