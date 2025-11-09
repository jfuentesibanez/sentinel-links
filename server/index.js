import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Client } from '@notionhq/client';

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

// Helper function to extract links from Notion blocks
function extractLinksFromBlocks(blocks) {
  const links = [];
  let currentCategory = 'General';

  for (const block of blocks) {
    // Check if it's a heading (category)
    if (block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3') {
      const heading = block[block.type];
      if (heading?.rich_text?.[0]?.plain_text) {
        currentCategory = heading.rich_text[0].plain_text.trim();
      }
    }

    // Check if it's a paragraph with a link
    if (block.type === 'paragraph') {
      const richText = block.paragraph?.rich_text || [];

      for (const text of richText) {
        if (text.type === 'text' && text.href) {
          links.push({
            id: Date.now() + Math.random(),
            title: text.plain_text || text.href,
            url: text.href,
            category: currentCategory,
            notionUrl: text.href,
            source: 'notion'
          });
        }
      }
    }

    // Check if it's a bookmark
    if (block.type === 'bookmark') {
      const bookmark = block.bookmark;
      links.push({
        id: Date.now() + Math.random(),
        title: bookmark.caption?.[0]?.plain_text || bookmark.url,
        url: bookmark.url,
        category: currentCategory,
        notionUrl: bookmark.url,
        source: 'notion'
      });
    }

    // Check if it's a link_to_page
    if (block.type === 'link_to_page') {
      const linkToPage = block.link_to_page;
      if (linkToPage.type === 'page_id') {
        links.push({
          id: Date.now() + Math.random(),
          title: `Page ${linkToPage.page_id.substring(0, 8)}...`,
          url: `https://www.notion.so/${linkToPage.page_id.replace(/-/g, '')}`,
          category: currentCategory,
          notionUrl: `https://www.notion.so/${linkToPage.page_id.replace(/-/g, '')}`,
          source: 'notion'
        });
      }
    }
  }

  return links;
}

// Sync with Notion endpoint
app.post('/api/sync-notion', async (req, res) => {
  const { notionPageId } = req.body;
  const notionToken = process.env.NOTION_API_KEY;

  if (!notionToken) {
    return res.status(500).json({
      error: 'Notion API key not configured on server. Please set NOTION_API_KEY in .env file.'
    });
  }

  if (!notionPageId) {
    return res.status(400).json({
      error: 'Notion page ID is required'
    });
  }

  try {
    const notion = new Client({ auth: notionToken });

    // Fetch all blocks from the page
    const blocks = [];
    let cursor = undefined;

    do {
      const response = await notion.blocks.children.list({
        block_id: notionPageId,
        start_cursor: cursor,
        page_size: 100
      });

      blocks.push(...response.results);
      cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    // Extract links from blocks
    const links = extractLinksFromBlocks(blocks);

    // Group by categories
    const categories = {};
    links.forEach(link => {
      if (!categories[link.category]) {
        categories[link.category] = [];
      }
      categories[link.category].push(link);
    });

    res.json({
      links,
      categories,
      total: links.length
    });

  } catch (error) {
    console.error('Error syncing with Notion:', error);
    res.status(500).json({
      error: 'Failed to sync with Notion',
      message: error.message,
      code: error.code
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
