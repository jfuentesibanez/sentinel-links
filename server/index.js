import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Sync with Notion endpoint
app.post('/api/sync-notion', async (req, res) => {
  const { notionPageId } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'API key not configured on server'
    });
  }

  if (!notionPageId) {
    return res.status(400).json({
      error: 'Notion page ID is required'
    });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `Using the Notion fetch tool, get the full content of page ID: ${notionPageId}. Return ONLY the raw content text from inside the <content> tags, nothing else.`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        error: `Anthropic API error: ${response.status}`,
        details: errorData
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Error syncing with Notion:', error);
    res.status(500).json({
      error: 'Failed to sync with Notion',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
