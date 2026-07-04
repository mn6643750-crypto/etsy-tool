export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, model, max_tokens } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request: messages array is required' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: model || 'llama-3.1-8b-instant',
        max_tokens: max_tokens || 3000,
        messages
      })
    });

    const data = await response.json();

    // Log and handle Groq API errors
    if (!response.ok) {
      console.error('Groq API error:', {
        status: response.status,
        statusText: response.statusText,
        body: data
      });
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

    return res.status(200).json(data);

  } catch (error) {
    console.error('Generate handler error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
}