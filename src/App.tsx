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
  guid?: string;
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
  },
  {
    id: 'lemonde',
    name: 'Le Monde',
    url: 'https://www.lemonde.fr/rss/une.xml',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800'
  },
  {
    id: 'liberation',
    name: 'Libération',
    url: 'https://www.liberation.fr/arc/outboundfeeds/rss-all/',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-800'
  },
  {
    id: 'figaro',
    name: 'Le Figaro',
    url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml',
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-800'
  }
];

// Image de fallback par défaut
const defaultFallbackImage = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop';

declare global {
  interface Window {
    google: any;
    rss2json_gfapi: any;
  }
}

const App: React.FC = () => {
  const [feeds, setFeeds] = useState<Record<string, RSSFeed>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string>>({});
  const [selectedFeed, setSelectedFeed] = useState<string>('all');
  const [menuOpen, setMenuOpen] = useState(false);

  // Fonction améliorée pour extraire l'image réelle de l'article
  const extractRealImageFromContent = (item: any): string => {
    console.log('Extracting image for:', item.title?.substring(0, 50));
    console.log('Item data:', {
      thumbnail: item.thumbnail,
      enclosure: item.enclosure,
      content: item.content?.substring(0, 200),
      description: item.description?.substring(0, 200)
    });

    try {
      // 1. Vérifier thumbnail direct de RSS2JSON
      if (item.thumbnail && item.thumbnail.trim() !== '' && item.thumbnail !== 'null') {
        console.log('Found thumbnail:', item.thumbnail);
        return item.thumbnail;
      }

      // 2. Vérifier enclosure (pièces jointes)
      if (item.enclosure) {
        if (typeof item.enclosure === 'string' && item.enclosure.includes('http')) {
          console.log('Found enclosure string:', item.enclosure);
          return item.enclosure;
        }
        if (item.enclosure.link && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
          console.log('Found enclosure object:', item.enclosure.link);
          return item.enclosure.link;
        }
      }

      // 3. Analyser le contenu HTML complet
      const contentToAnalyze = item.content || item.description || '';
      if (contentToAnalyze) {
        console.log('Analyzing content for images...');
        
        // Créer un parser DOM temporaire
        const parser = new DOMParser();
        const doc = parser.parseFromString(contentToAnalyze, 'text/html');
        
        // Chercher toutes les images
        const images = doc.querySelectorAll('img');
        console.log('Found', images.length, 'img tags');
        
        for (let img of images) {
          const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
          if (src && src.trim() !== '') {
            const srcLower = src.toLowerCase();
            
            // Filtrer les images non pertinentes
            if (!srcLower.includes('logo') && 
                !srcLower.includes('icon') && 
                !srcLower.includes('avatar') &&
                !srcLower.includes('button') &&
                !srcLower.includes('badge') &&
                !srcLower.includes('pixel') &&
                !srcLower.includes('tracking') &&
                !srcLower.includes('1x1') &&
                src.length > 20) {
              
              let finalUrl = src;
              
              // Convertir les URLs relatives
              if (src.startsWith('//')) {
                finalUrl = 'https:' + src;
              } else if (src.startsWith('/')) {
                // URL relative, essayer de construire l'URL complète
                try {
                  const itemUrl = new URL(item.link);
                  finalUrl = itemUrl.origin + src;
                } catch (e) {
                  continue;
                }
              } else if (!src.startsWith('http')) {
                continue;
              }
              
              console.log('Found valid image:', finalUrl);
              return finalUrl;
            }
          }
        }

        // 4. Chercher des patterns d'images dans le texte brut
        const imagePatterns = [
          /https?:\/\/[^\s<>"']+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s<>"']*)?/gi,
          /src=["']([^"']+\.(?:jpg|jpeg|png|gif|webp)[^"']*)["']/gi,
          /"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/gi
        ];

        for (let pattern of imagePatterns) {
          const matches = contentToAnalyze.match(pattern);
          if (matches && matches.length > 0) {
            console.log('Found pattern matches:', matches.length);
            
            for (let match of matches) {
              let url = match;
              
              // Extraire l'URL si c'est dans un attribut src
              if (pattern.toString().includes('src=')) {
                const srcMatch = match.match(/src=["']([^"']+)["']/);
                if (srcMatch) url = srcMatch[1];
              } else if (pattern.toString().includes('"')) {
                url = match.replace(/"/g, '');
              }
              
              if (url && url.length > 20) {
                const urlLower = url.toLowerCase();
                if (!urlLower.includes('logo') && 
                    !urlLower.includes('icon') &&
                    !urlLower.includes('avatar') &&
                    !urlLower.includes('tracking')) {
                  
                  if (url.startsWith('//')) {
                    url = 'https:' + url;
                  }
                  
                  if (url.startsWith('http')) {
                    console.log('Found pattern image:', url);
                    return url;
                  }
                }
              }
            }
          }
        }

        // 5. Chercher dans les métadonnées spécifiques aux flux
        if (item.guid && typeof item.guid === 'string') {
          const guidLower = item.guid.toLowerCase();
          if (guidLower.includes('http') && 
              (guidLower.includes('.jpg') || guidLower.includes('.png') || 
               guidLower.includes('.jpeg') || guidLower.includes('.webp'))) {
            console.log('Found image in GUID:', item.guid);
            return item.guid;
          }
        }

        // 6. Chercher dans les propriétés étendues de l'item
        for (let key in item) {
          if (typeof item[key] === 'string' && item[key].includes('http')) {
            const value = item[key].toLowerCase();
            if ((value.includes('.jpg') || value.includes('.png') || 
                 value.includes('.jpeg') || value.includes('.webp')) &&
                !value.includes('logo') && !value.includes('icon')) {
              console.log('Found image in property', key, ':', item[key]);
              return item[key];
            }
          }
        }
      }

    } catch (error) {
      console.warn('Erreur lors de l\'extraction d\'image:', error);
    }

    console.log('No image found, using fallback');
    return defaultFallbackImage;
  };

  // Fonction pour charger un flux RSS avec RSS2JSON GFAPI
  const fetchRSSFeed = async (config: FeedConfig) => {
    setLoading(prev => ({ ...prev, [config.id]: true }));
    setError(prev => ({ ...prev, [config.id]: '' }));

    try {
      console.log('Fetching feed:', config.name, config.url);

      // Utiliser RSS2JSON avec gfapi.js
      if (window.rss2json_gfapi) {
        const response = await new Promise<any>((resolve, reject) => {
          window.rss2json_gfapi.load(config.url, (data: any) => {
            console.log('RSS2JSON response for', config.name, ':', data);
            
            if (data && data.status === 'ok') {
              resolve(data);
            } else {
              reject(new Error(data?.message || 'Erreur RSS2JSON'));
            }
          });
        });

        const feedData: RSSFeed = {
          title: response.feed.title || config.name,
          description: response.feed.description || '',
          link: response.feed.link || '',
          items: response.items.slice(0, 20).map((item: any, index: number) => {
            console.log(`Processing item ${index + 1}:`, item.title?.substring(0, 50));
            
            return {
              title: item.title || 'بدون عنوان',
              link: item.link || '#',
              pubDate: item.pubDate || new Date().toISOString(),
              author: item.author || item.creator || 'غير محدد',
              description: item.description || '',
              content: item.content || item.description || '',
              categories: item.categories || [],
              thumbnail: extractRealImageFromContent(item),
              guid: item.guid
            };
          })
        };

        console.log('Processed feed data:', feedData);
        setFeeds(prev => ({ ...prev, [config.id]: feedData }));
        return;
      }

      // Fallback avec fetch direct
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(config.url)}`);
      const data = await response.json();

      if (data.status === 'ok') {
        const feedData: RSSFeed = {
          title: data.feed.title || config.name,
          description: data.feed.description || '',
          link: data.feed.link || '',
          items: data.items.slice(0, 20).map((item: any) => ({
            title: item.title || 'بدون عنوان',
            link: item.link || '#',
            pubDate: item.pubDate || new Date().toISOString(),
            author: item.author || item.creator || 'غير محدد',
            description: item.description || '',
            content: item.content || item.description || '',
            categories: item.categories || [],
            thumbnail: extractRealImageFromContent(item)
          }))
        };

        setFeeds(prev => ({ ...prev, [config.id]: feedData }));
      } else {
        throw new Error(data.message || 'Erreur lors du chargement du flux');
      }

    } catch (err) {
      console.error(`Erreur pour ${config.name}:`, err);
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
    // Attendre que les APIs externes soient chargées
    const initFeeds = () => {
      console.log('Initializing feeds...');
      console.log('RSS2JSON GFAPI available:', !!window.rss2json_gfapi);
      console.log('Google JSAPI available:', !!window.google);
      
      feedConfigs.forEach(config => {
        fetchRSSFeed(config);
      });
    };

    // Vérifier si les APIs sont déjà chargées
    if (window.rss2json_gfapi) {
      initFeeds();
    } else {
      // Attendre que les scripts se chargent
      const checkAPIs = setInterval(() => {
        if (window.rss2json_gfapi) {
          clearInterval(checkAPIs);
          initFeeds();
        }
      }, 500);

      // Timeout après 10 secondes
      setTimeout(() => {
        clearInterval(checkAPIs);
        if (!window.rss2json_gfapi) {
          console.warn('APIs not loaded, trying anyway...');
          initFeeds();
        }
      }, 10000);
    }
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
                {filteredItems.length} مقال متاح
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
              {filteredItems.map((item, index) => (
                <article key={`${item.feedId}-${index}-${item.link}`} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="lg:flex">
                    <div className="lg:w-1/3">
                      <img
                        src={item.thumbnail || defaultFallbackImage}
                        alt={item.title}
                        className="w-full h-48 lg:h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== defaultFallbackImage) {
                            console.log('Image failed to load:', target.src);
                            target.src = defaultFallbackImage;
                          }
                        }}
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.log('Image loaded successfully:', target.src);
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