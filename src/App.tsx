import React, { useState, useEffect } from 'react';
import { RefreshCw, Calendar, User, ExternalLink, Menu, X, AlertCircle } from 'lucide-react';

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  author?: string;
  description: string;
  content?: string;
  categories?: string[];
  thumbnail?: string;
}

interface RSSFeed {
  title: string;
  description: string;
  link: string;
  items: RSSItem[];
}

interface FeedConfig {
  id: string;
  name: string;
  url: string;
  color: string;
  bgColor: string;
  textColor: string;
}

const feedConfigs: FeedConfig[] = [
  {
    id: 'arabi21-politics',
    name: 'عربي21 - سياسة دولية',
    url: 'https://arabi21.com/Rss/SectionNewsRss?id=316',
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-800'
  },
  {
    id: 'arabi21-general',
    name: 'عربي21 - عام',
    url: 'https://arabi21.com/Rss/SectionNewsRss?id=410',
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-800'
  }
];

// Alternative RSS proxy services
const RSS_PROXIES = [
  'https://api.rss2json.com/v1/api.json',
  'https://api.allorigins.win/get?url=',
  'https://cors-anywhere.herokuapp.com/'
];

const App: React.FC = () => {
  const [feeds, setFeeds] = useState<Record<string, RSSFeed>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string>>({});
  const [selectedFeed, setSelectedFeed] = useState<string>('all');
  const [menuOpen, setMenuOpen] = useState(false);

  const extractImageFromContent = (content: string): string | null => {
    if (!content) return null;
    
    // Multiple strategies to extract images from content
    
    // 1. Try to extract from img tags with various formats
    const imgPatterns = [
      /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
      /<img[^>]+src=([^\s>]+)[^>]*>/gi,
      /src=["']([^"']+\.(?:jpg|jpeg|png|gif|webp))["']/gi,
      /src=([^\s"']+\.(?:jpg|jpeg|png|gif|webp))/gi
    ];
    
    for (const pattern of imgPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const imageUrl = match[1];
        if (imageUrl && !imageUrl.includes('logo') && !imageUrl.includes('icon') && imageUrl.length > 10) {
          // Clean up the URL
          const cleanUrl = imageUrl.replace(/&amp;/g, '&').trim();
          if (cleanUrl.startsWith('http') || cleanUrl.startsWith('//')) {
            return cleanUrl.startsWith('//') ? 'https:' + cleanUrl : cleanUrl;
          }
        }
      }
    }
    
    // 2. Try to extract from media:content or media:thumbnail
    const mediaPatterns = [
      /<media:content[^>]+url=["']([^"']+)["'][^>]*>/gi,
      /<media:thumbnail[^>]+url=["']([^"']+)["'][^>]*>/gi,
      /<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image[^"']*["'][^>]*>/gi
    ];
    
    for (const pattern of mediaPatterns) {
      const match = content.match(pattern);
      if (match) return match[1];
    }
    
    // 3. Look for any URL that looks like an image
    const urlPattern = /https?:\/\/[^\s<>"']+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s<>"']*)?/gi;
    const urlMatches = content.match(urlPattern);
    if (urlMatches && urlMatches.length > 0) {
      // Filter out logos and small images
      for (const url of urlMatches) {
        if (!url.includes('logo') && !url.includes('icon') && !url.includes('avatar')) {
          return url;
        }
      }
    }
    
    return null;
  };

  const fetchWithRSS2JSON = async (config: FeedConfig) => {
    try {
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(config.url)}&count=20&api_key=YOUR_API_KEY`);
      const data = await response.json();
      
      if (data.status === 'ok') {
        return {
          title: data.feed.title || config.name,
          description: data.feed.description || '',
          link: data.feed.link || '',
          items: data.items.map((item: any) => ({
            title: item.title || 'بدون عنوان',
            link: item.link || '#',
            pubDate: item.pubDate || new Date().toISOString(),
            author: item.author || item.creator || 'غير محدد',
            description: item.description || item.content || '',
            content: item.content || item.description || '',
            categories: item.categories || [],
            thumbnail: item.thumbnail || 
                      item.enclosure?.url ||
                      extractImageFromContent(item.content || item.description || '') ||
                      extractImageFromContent(item.title || '') ||
                      null
          }))
        };
      }
      throw new Error(data.message || 'Failed to fetch RSS');
    } catch (error) {
      console.error('RSS2JSON failed:', error);
      throw error;
    }
  };

  const fetchWithAllOrigins = async (config: FeedConfig) => {
    try {
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(config.url)}`);
      const data = await response.json();
      
      if (data.contents) {
        // Parse XML manually
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data.contents, 'text/xml');
        const items = xmlDoc.querySelectorAll('item');
        
        const feedItems: RSSItem[] = Array.from(items).slice(0, 20).map(item => {
          const title = item.querySelector('title')?.textContent || 'بدون عنوان';
          const link = item.querySelector('link')?.textContent || '#';
          const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();
          const author = item.querySelector('author')?.textContent || 
                        item.querySelector('dc\\:creator')?.textContent || 
                        'غير محدد';
          const description = item.querySelector('description')?.textContent || '';
          const content = item.querySelector('content\\:encoded')?.textContent || description;
          const enclosure = item.querySelector('enclosure[type^="image"]');
          const enclosureUrl = enclosure?.getAttribute('url') || null;
          
          return {
            title,
            link,
            pubDate,
            author,
            description,
            content,
            categories: [],
            thumbnail: enclosureUrl ||
                      extractImageFromContent(content) ||
                      extractImageFromContent(description) ||
                      null
          };
        });

        return {
          title: xmlDoc.querySelector('channel > title')?.textContent || config.name,
          description: xmlDoc.querySelector('channel > description')?.textContent || '',
          link: xmlDoc.querySelector('channel > link')?.textContent || '',
          items: feedItems
        };
      }
      throw new Error('No content received');
    } catch (error) {
      console.error('AllOrigins failed:', error);
      throw error;
    }
  };

  const fetchRSSFeed = async (config: FeedConfig) => {
    setLoading(prev => ({ ...prev, [config.id]: true }));
    setError(prev => ({ ...prev, [config.id]: '' }));

    try {
      // Try RSS2JSON first
      let feedData;
      try {
        feedData = await fetchWithRSS2JSON(config);
      } catch (error) {
        console.log('RSS2JSON failed, trying AllOrigins...');
        feedData = await fetchWithAllOrigins(config);
      }

      setFeeds(prev => ({
        ...prev,
        [config.id]: feedData
      }));
    } catch (err) {
      console.error('All methods failed:', err);
      setError(prev => ({ 
        ...prev, 
        [config.id]: 'فشل في تحميل الخلاصة. يرجى المحاولة لاحقاً.'
      }));
    } finally {
      setLoading(prev => ({ ...prev, [config.id]: false }));
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'تاريخ غير محدد';
    }
  };

  const stripHTML = (html: string): string => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const truncateText = (text: string, maxLength: number): string => {
    const cleanText = stripHTML(text);
    return cleanText.length > maxLength 
      ? cleanText.substring(0, maxLength) + '...' 
      : cleanText;
  };

  const refreshFeed = (config: FeedConfig) => {
    fetchRSSFeed(config);
  };

  const refreshAllFeeds = () => {
    feedConfigs.forEach(config => {
      fetchRSSFeed(config);
    });
  };

  useEffect(() => {
    feedConfigs.forEach(config => {
      fetchRSSFeed(config);
    });
  }, []);

  const getAllItems = () => {
    const allItems: (RSSItem & { feedId: string; feedConfig: FeedConfig })[] = [];
    
    feedConfigs.forEach(config => {
      const feed = feeds[config.id];
      if (feed && feed.items) {
        feed.items.forEach(item => {
          allItems.push({
            ...item,
            feedId: config.id,
            feedConfig: config
          });
        });
      }
    });

    return allItems.sort((a, b) => 
      new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );
  };

  const getFilteredItems = () => {
    if (selectedFeed === 'all') {
      return getAllItems();
    }
    
    const feed = feeds[selectedFeed];
    const config = feedConfigs.find(c => c.id === selectedFeed);
    
    if (!feed || !config || !feed.items) return [];
    
    return feed.items.map(item => ({
      ...item,
      feedId: selectedFeed,
      feedConfig: config
    }));
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 space-x-reverse">
              <img 
                src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=40&h=40&fit=crop&crop=face" 
                alt="Logo" 
                className="h-10 w-10 rounded-full object-cover border-2 border-gray-300"
              />
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                خلاصة الأخبار المفضلة
              </h1>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={refreshAllFeeds}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="تحديث جميع الخلاصات"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className={`lg:w-1/4 ${menuOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">المصادر</h2>
              
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedFeed('all')}
                  className={`w-full text-right px-4 py-2 rounded-lg transition-colors ${
                    selectedFeed === 'all' 
                      ? 'bg-blue-100 text-blue-800 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  جميع المصادر
                </button>
                
                {feedConfigs.map(config => (
                  <div key={config.id} className="space-y-2">
                    <button
                      onClick={() => setSelectedFeed(config.id)}
                      className={`w-full text-right px-4 py-2 rounded-lg transition-colors ${
                        selectedFeed === config.id 
                          ? `${config.bgColor} ${config.textColor} font-medium` 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {config.name}
                    </button>
                    
                    {loading[config.id] && (
                      <div className="text-sm text-gray-500 px-4 flex items-center">
                        <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                        جاري التحميل...
                      </div>
                    )}
                    
                    {error[config.id] && (
                      <div className="text-sm text-red-500 px-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 ml-2" />
                          <span>{error[config.id]}</span>
                        </div>
                        <button
                          onClick={() => refreshFeed(config)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedFeed === 'all' ? 'جميع الأخبار' : feedConfigs.find(c => c.id === selectedFeed)?.name}
              </h2>
              <p className="text-gray-600">
                {filteredItems.length} خبر متاح
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
              {filteredItems.map((item, index) => (
                <article key={`${item.feedId}-${index}`} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="lg:flex">
                    <div className="lg:w-1/3">
                      <img
                        src={item.thumbnail || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop'}
                        alt={item.title}
                        className="w-full h-48 lg:h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('unsplash')) {
                            target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop';
                          }
                        }}
                      />
                    </div>
                    
                    <div className="lg:w-2/3 p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${item.feedConfig.bgColor} ${item.feedConfig.textColor}`}>
                          {item.feedConfig.name}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500 space-x-1 space-x-reverse">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(item.pubDate)}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                        {item.title}
                      </h3>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <User className="h-4 w-4 ml-1" />
                        <span>{item.author}</span>
                      </div>
                      
                      <p className="text-gray-700 mb-4 line-clamp-3">
                        {truncateText(item.description, 200)}
                      </p>
                      
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        <span>اقرأ المزيد</span>
                        <ExternalLink className="h-4 w-4 mr-1" />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filteredItems.length === 0 && !Object.values(loading).some(Boolean) && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">لا توجد أخبار متاحة حالياً</p>
                <button
                  onClick={refreshAllFeeds}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  إعادة المحاولة
                </button>
              </div>
            )}

            {Object.values(loading).some(Boolean) && filteredItems.length === 0 && (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500 text-lg">جاري تحميل الأخبار...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;