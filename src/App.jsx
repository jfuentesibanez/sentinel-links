import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, RefreshCw, ExternalLink, Folder, Tag, AlertCircle, Plus, X, Edit2, Trash2 } from 'lucide-react';
import './App.css';

// Constants
const NOTION_PAGE_ID = import.meta.env.VITE_NOTION_PAGE_ID || '11f46694-4091-8028-9320-e734a64f47c2';
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const STORAGE_KEY = 'sentinel_links_data';

const SAMPLE_DATA = {
  'AI & Machine Learning': [
    { title: 'Computational irreducibility - Wikipedia', url: 'https://www.notion.so/11f4669440918141b5cff8f4aaebc7ae', category: 'AI & Machine Learning' },
    { title: 'Emergent Properties | Definition & Examples', url: 'https://www.notion.so/11f4669440918145963ffde6b48160a8', category: 'AI & Machine Learning' },
    { title: 'AlphaEvolve', url: 'https://www.notion.so/28146694409181e78206ff915def576f', category: 'AI & Machine Learning' },
    { title: 'Karpathy', url: 'https://www.notion.so/2834669440918167a532e2a346ce5fc3', category: 'AI & Machine Learning' },
  ],
  'Robotics': [
    { title: 'Robots', url: 'https://www.notion.so/193466944091814aa2c6e487bbcf8a09', category: 'Robotics' },
    { title: 'Robot', url: 'https://www.notion.so/15b46694409181d9844bfd42a07b836f', category: 'Robotics' },
    { title: 'Humanoid Robotics', url: 'https://www.notion.so/1c046694409181a88089ea34d239c10b', category: 'Robotics' },
  ],
  'Economy & Post-Economy': [
    { title: 'Post economy', url: 'https://www.notion.so/17e4669440918117af20d38da55dfca2', category: 'Economy & Post-Economy' },
    { title: 'The big replacement', url: 'https://www.notion.so/22e4669440918118abcff3d98440b0e6', category: 'Economy & Post-Economy' },
    { title: 'Virtual economy Post economy', url: 'https://www.notion.so/26f46694409181418960e6bcd45ba8df', category: 'Economy & Post-Economy' },
  ],
  'Technology & Hardware': [
    { title: 'Pentium', url: 'https://www.notion.so/17c46694409181c6adb0e4d6626a2066', category: 'Technology & Hardware' },
    { title: 'ASML', url: 'https://www.notion.so/14d46694409181aead51e40ffbb47118', category: 'Technology & Hardware' },
    { title: 'GPU', url: 'https://www.notion.so/12e46694409181b18471c4fe6723d10f', category: 'Technology & Hardware' },
  ],
};

const SentinelLinksViewer = () => {
  const [links, setLinks] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lastSync, setLastSync] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '', category: '' });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const { links: savedLinks, categories: savedCategories, lastSync: savedLastSync } = JSON.parse(savedData);
        setLinks(savedLinks);
        setCategories(savedCategories);
        setLastSync(savedLastSync ? new Date(savedLastSync) : null);
      } catch (err) {
        console.error('Error loading saved data:', err);
        // Load sample data as fallback
        loadSampleData();
      }
    } else {
      // Load sample data if no saved data
      loadSampleData();
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (links.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ links, categories, lastSync }));
    }
  }, [links, categories, lastSync]);

  const loadSampleData = () => {
    const allLinks = Object.values(SAMPLE_DATA).flat();
    setLinks(allLinks);
    setCategories(SAMPLE_DATA);
  };

  // Extract links from Notion content
  const extractLinks = useCallback((notionContent) => {
    const extractedLinks = [];
    const categoryMap = {};

    let currentCategory = 'General';

    const lines = notionContent.split('\n');

    for (const line of lines) {
      // Detect categories
      if (line.match(/^[A-Z][a-zA-Z\s&]+$/) && !line.includes('<')) {
        currentCategory = line.trim();
      }

      // Extract links
      const pageMatch = line.match(/<page url="{{([^}]+)}}">(.*?)<\/page>/);
      if (pageMatch) {
        const url = pageMatch[1];
        const title = pageMatch[2].replace(/\\\|/g, '|').trim();

        if (title) {
          const link = {
            id: Date.now() + Math.random(), // Add unique ID
            url,
            title,
            category: currentCategory,
            notionUrl: `https://www.notion.so/${url.split('/').pop()}`,
            source: 'notion'
          };

          extractedLinks.push(link);

          if (!categoryMap[currentCategory]) {
            categoryMap[currentCategory] = [];
          }
          categoryMap[currentCategory].push(link);
        }
      }
    }

    return { links: extractedLinks, categories: categoryMap };
  }, []);

  // Sync with Notion via Anthropic API
  const syncWithNotion = useCallback(async () => {
    if (!ANTHROPIC_API_KEY) {
      setError('API key not configured. Please set VITE_ANTHROPIC_API_KEY in your .env file.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: `Using the Notion fetch tool, get the full content of page ID: ${NOTION_PAGE_ID}. Return ONLY the raw content text from inside the <content> tags, nothing else.`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text;

      if (!content) {
        throw new Error('No content received from API');
      }

      const { links: notionLinks, categories: notionCategories } = extractLinks(content);

      // Merge with existing local-only links
      const localLinks = links.filter(link => link.source !== 'notion');
      const mergedLinks = [...notionLinks, ...localLinks];

      // Merge categories
      const mergedCategories = { ...notionCategories };
      localLinks.forEach(link => {
        if (!mergedCategories[link.category]) {
          mergedCategories[link.category] = [];
        }
        mergedCategories[link.category].push(link);
      });

      setLinks(mergedLinks);
      setCategories(mergedCategories);
      setLastSync(new Date());

    } catch (err) {
      console.error('Error syncing with Notion:', err);
      setError(err.message || 'Error syncing with Notion. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [extractLinks, links]);

  // Add new link manually
  const handleAddLink = useCallback((e) => {
    e.preventDefault();

    if (!newLink.title || !newLink.url || !newLink.category) {
      setError('Please fill in all fields');
      return;
    }

    const link = {
      id: Date.now() + Math.random(),
      title: newLink.title,
      url: newLink.url,
      category: newLink.category,
      notionUrl: newLink.url,
      source: 'local'
    };

    const updatedLinks = [...links, link];
    const updatedCategories = { ...categories };

    if (!updatedCategories[link.category]) {
      updatedCategories[link.category] = [];
    }
    updatedCategories[link.category].push(link);

    setLinks(updatedLinks);
    setCategories(updatedCategories);
    setNewLink({ title: '', url: '', category: '' });
    setShowAddForm(false);
    setError(null);
  }, [newLink, links, categories]);

  // Delete link
  const handleDeleteLink = useCallback((linkId) => {
    const updatedLinks = links.filter(link => link.id !== linkId);

    // Rebuild categories
    const updatedCategories = {};
    updatedLinks.forEach(link => {
      if (!updatedCategories[link.category]) {
        updatedCategories[link.category] = [];
      }
      updatedCategories[link.category].push(link);
    });

    setLinks(updatedLinks);
    setCategories(updatedCategories);
  }, [links]);

  // Memoized filtered links for performance
  const filteredLinks = useMemo(() => {
    return links.filter(link => {
      const matchesSearch = link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           link.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || link.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [links, searchTerm, selectedCategory]);

  const categoryList = useMemo(() => ['all', ...Object.keys(categories)], [categories]);

  // Link item component
  const LinkItem = ({ link, showCategory = false }) => (
    <div className="group flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-all border border-transparent hover:border-blue-500/50">
      <a
        href={link.notionUrl || link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 flex-1"
        aria-label={`Open ${link.title}`}
      >
        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
        <span className="flex-1 text-slate-200 group-hover:text-white transition-colors">
          {link.title}
        </span>
        {showCategory && <Tag className="w-4 h-4 text-slate-500" />}
      </a>
      {link.source === 'local' && (
        <button
          onClick={() => handleDeleteLink(link.id)}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
          aria-label="Delete link"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            ⌨️ The Independent Sentinel
          </h1>
          <p className="text-slate-400">
            Manage and classify your reading links
          </p>
          {lastSync && (
            <p className="text-sm text-slate-500 mt-2">
              Last sync: {lastSync.toLocaleString()}
            </p>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-200 font-medium">Error</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 transition-colors"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Add Link Form */}
        {showAddForm && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Link</h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewLink({ title: '', url: '', category: '' });
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddLink} className="grid gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Title</label>
                <input
                  type="text"
                  value={newLink.title}
                  onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Link title"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">URL</label>
                <input
                  type="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Category</label>
                <input
                  type="text"
                  value={newLink.category}
                  onChange={(e) => setNewLink({ ...newLink, category: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Category name"
                  list="categories"
                />
                <datalist id="categories">
                  {Object.keys(categories).map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-all"
              >
                Add Link
              </button>
            </form>
          </div>
        )}

        {/* Controls */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-slate-700">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search links..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
                aria-label="Search links"
              />
            </div>

            {/* Category selector */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              aria-label="Filter by category"
            >
              {categoryList.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? '📁 All categories' : `📂 ${cat}`}
                </option>
              ))}
            </select>

            {/* Add Link button */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap"
              aria-label="Add new link"
            >
              <Plus className="w-5 h-5" />
              Add Link
            </button>

            {/* Sync button */}
            <button
              onClick={syncWithNotion}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap"
              aria-label="Sync with Notion"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Syncing...' : 'Sync Notion'}
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 text-sm text-slate-400">
            <div>
              <span className="font-semibold text-blue-400">{filteredLinks.length}</span> showing
            </div>
            <div>
              <span className="font-semibold text-purple-400">{links.length}</span> total
            </div>
            <div>
              <span className="font-semibold text-green-400">{Object.keys(categories).length}</span> categories
            </div>
          </div>
        </div>

        {/* Links list */}
        <div className="grid gap-6">
          {selectedCategory === 'all' ? (
            // Category view
            Object.entries(categories).map(([category, categoryLinks]) => {
              const visibleLinks = categoryLinks.filter(link =>
                link.title.toLowerCase().includes(searchTerm.toLowerCase())
              );

              if (visibleLinks.length === 0) return null;

              return (
                <div key={category} className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 border-b border-slate-600">
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-blue-400" />
                      <h2 className="text-xl font-bold">{category}</h2>
                      <span className="ml-auto bg-slate-700 px-3 py-1 rounded-full text-sm text-slate-300">
                        {visibleLinks.length}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 grid gap-2">
                    {visibleLinks.map((link) => (
                      <LinkItem key={link.id} link={link} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            // Single category view
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 border-b border-slate-600">
                <div className="flex items-center gap-3">
                  <Folder className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-bold">{selectedCategory}</h2>
                  <span className="ml-auto bg-slate-700 px-3 py-1 rounded-full text-sm text-slate-300">
                    {filteredLinks.length}
                  </span>
                </div>
              </div>
              <div className="p-4 grid gap-2">
                {filteredLinks.map((link) => (
                  <LinkItem key={link.id} link={link} showCategory />
                ))}
              </div>
            </div>
          )}
        </div>

        {filteredLinks.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No links found</p>
            <p className="text-sm mt-2">Try different search terms or add a new link</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SentinelLinksViewer;
