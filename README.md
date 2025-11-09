# The Independent Sentinel - Link Manager

A standalone React application for managing and classifying your reading links. Import links from Notion and add new ones manually, all stored locally in your browser.

## Features

- **Import from Notion**: Sync links from your Notion database
- **Add Links Manually**: Quickly add new links with title, URL, and category
- **Local Storage**: All your links are saved in your browser's localStorage
- **Category Organization**: Organize links by categories
- **Search & Filter**: Search links by title or category, filter by specific categories
- **Delete Links**: Remove locally-added links (Notion-imported links are preserved on re-sync)
- **Beautiful Dark UI**: Modern, responsive design with smooth animations

## Prerequisites

- Node.js (v20.10.0 or later recommended)
- npm or yarn
- (Optional) Anthropic API key for Notion sync

## Installation

1. Navigate to the project directory:
```bash
cd sentinel-links
```

2. Install dependencies:
```bash
npm install
```

3. Set up Notion integration (to enable syncing):
   - See **[NOTION_SETUP.md](./NOTION_SETUP.md)** for detailed instructions
   - Quick start:
     1. Create a Notion integration at https://www.notion.so/my-integrations
     2. Share your Notion page with the integration
     3. Copy the integration token to `.env`:
        ```
        NOTION_API_KEY=secret_your_token_here
        VITE_NOTION_PAGE_ID=your_page_id
        ```

## Running the App

### Full Stack (Frontend + Backend)

To run both the frontend and backend servers together (required for Notion sync):

```bash
npm run dev:full
```

This starts:
- Frontend (React + Vite) at `http://localhost:5173`
- Backend (Express API) at `http://localhost:3001`

### Frontend Only

If you just want to use the app without Notion sync:

```bash
npm run dev
```

The app will open at `http://localhost:5173` - you can still add links manually!

## Building for Production

To create a production build:

```bash
npm run build
```

The build files will be in the `dist` folder. You can preview the production build with:

```bash
npm run preview
```

## Usage

### Initial Setup

When you first open the app, it will load with sample data to demonstrate the interface.

### Adding Links Manually

1. Click the **"Add Link"** button
2. Fill in the form:
   - **Title**: The name/title of the link
   - **URL**: The full URL (e.g., https://example.com)
   - **Category**: Either type a new category or select from existing ones
3. Click **"Add Link"** to save

### Syncing with Notion

1. Complete the Notion integration setup (see [NOTION_SETUP.md](./NOTION_SETUP.md))
2. Make sure both servers are running (`npm run dev:full`)
3. Click the **"Sync Notion"** button in the app
4. All links from your Notion page will be imported and categorized
5. Local links are preserved during sync

**Note**: The backend must be running for Notion sync to work!

### Managing Links

- **Search**: Use the search bar to find links by title or category
- **Filter by Category**: Use the dropdown to view links in a specific category
- **Delete Links**: Hover over locally-added links to see the delete button
  - Note: Notion-imported links cannot be deleted (they'll be re-imported on next sync)

### Data Persistence

All your links are automatically saved to your browser's localStorage:
- Links persist between sessions
- Data is saved whenever you add, delete, or sync links
- Clear your browser data to reset the app

## Project Structure

```
sentinel-links/
├── src/
│   ├── App.jsx          # Main component with all functionality
│   ├── App.css          # Component styles
│   ├── index.css        # Global styles
│   └── main.jsx         # Entry point
├── .env                 # Environment variables (git-ignored)
├── .env.example         # Environment variables template
├── package.json         # Project dependencies
└── README.md           # This file
```

## Technologies Used

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library
- **localStorage** - Client-side data persistence
- **Anthropic API** - For Notion integration

## Tips

- **Categories**: You can create new categories on the fly when adding links
- **Search**: The search works across both link titles and category names
- **Keyboard Navigation**: The form inputs support standard keyboard navigation
- **Responsive**: The app works on desktop and mobile devices

## Troubleshooting

### Notion Sync Not Working

1. Verify your API key is correctly set in `.env`
2. Make sure the Notion Page ID is correct
3. Check your internet connection
4. Look for error messages in the app's error banner

### Data Not Persisting

- Make sure your browser allows localStorage
- Check if you're in private/incognito mode (localStorage may not persist)
- Try clearing the site data and starting fresh

### Build Issues

If you encounter build warnings about unsupported Node.js version, you can either:
- Upgrade to Node.js v20.19.0 or v22.12.0+
- Ignore the warnings (the app should still work with v20.10.0)

## License

This is a personal project for managing reading links.
