# Notion Integration Setup Guide

To sync your links from Notion, you need to create a Notion integration and get an API token.

## Step 1: Create a Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click **"+ New integration"**
3. Fill in the details:
   - **Name**: Sentinel Links (or any name you prefer)
   - **Associated workspace**: Select your workspace
   - **Type**: Internal integration
4. Click **"Submit"**

## Step 2: Get Your Integration Token

1. After creating the integration, you'll see the **"Internal Integration Token"**
2. Click **"Show"** and then **"Copy"** to copy the token
3. It should start with `secret_`

## Step 3: Share Your Page with the Integration

**IMPORTANT**: Your integration won't have access to your pages by default!

1. Open the Notion page that contains your links
2. Click the **"Share"** button (top right)
3. Click **"Invite"**
4. Search for and select your integration name (e.g., "Sentinel Links")
5. Click **"Invite"**

## Step 4: Add Token to Your App

1. Open the `.env` file in your project folder
2. Add your token:
   ```
   NOTION_API_KEY=secret_your_actual_token_here
   VITE_NOTION_PAGE_ID=11f46694-4091-8028-9320-e734a64f47c2
   ```
3. Replace `secret_your_actual_token_here` with your actual token
4. Update the page ID if needed

## Step 5: Restart the Server

If the server is running, restart it:

```bash
# Stop the current server (Ctrl+C)
# Then restart with:
npm run dev:full
```

## Step 6: Test the Sync

1. Open the app at http://localhost:5173
2. Click the **"Sync Notion"** button
3. You should see all your links!

## Troubleshooting

### Error: "Could not find page"
- Make sure you've shared the page with your integration (Step 3)
- Check that the page ID in `.env` is correct

### Error: "Unauthorized"
- Verify your NOTION_API_KEY is correct in `.env`
- Make sure the token starts with `secret_`

### Only getting a few links
- The integration is working! All links should now sync
- Make sure your links are in the correct format in Notion (paragraphs with hyperlinks or bookmarks)

## How to Find Your Page ID

Your page ID is in the URL when you open the page in Notion:

```
https://www.notion.so/Your-Page-Title-11f4669440918028...
                                            ↑ This part is your page ID
```

Copy the long string of numbers and letters after the last dash.

## Supported Link Formats in Notion

The app will extract links from:
- **Paragraphs with hyperlinks** (text with URLs)
- **Bookmark blocks**
- **Link to page blocks**

Categories are detected from:
- **Heading 1** blocks
- **Heading 2** blocks
- **Heading 3** blocks

Organize your page with headings as categories and your links below them!
