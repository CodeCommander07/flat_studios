'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';

const tabs = [
  { key: 'article', label: '📄 Articles' },
  { key: 'blog', label: '📝 Blogs' },
  { key: 'guide', label: '📘 Guides' },
  { key: 'news', label: '🗞 News' },
  { key: 'changelog', label: '🧾 Changelogs' },
];

export default function BlogIndex() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('blog');
  const [loading, setLoading] = useState(true);

  const loadPosts = async (type) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/content?type=${type}&status=published`);
      if (!res.ok) throw new Error('Failed to load posts');
      const data = await res.json();
      setPosts(data.items);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(activeTab);
  }, [activeTab]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 text-white space-y-8">
      <h1 className="text-4xl font-bold text-center mb-4">📰 Our Content Hub</h1>
      <p className="text-center text-white/60 mb-8">
        Explore our latest posts, guides, and news below.
      </p>

      {/* Tabs */}
      <div className="flex justify-center flex-wrap gap-2 sm:gap-4 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-2 rounded-full font-medium transition ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 rounded-full bg-blue-600 -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {error && <p className="text-red-400 text-center">{error}</p>}

      {loading ? (
        <p className="text-center text-white/60">Loading {activeTab}s...</p>
      ) : posts.length === 0 ? (
        <p className="text-center text-white/60">
          No {activeTab}s published yet.
        </p>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {posts.map((post) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-lg hover:bg-white/10 transition"
              >
                <Link href={`/blog/${post.slug}`}>
                  <div>
                    {post.coverImage?.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.coverImage.url}
                        alt={post.coverImage.alt || post.title}
                        className="rounded-xl mb-3 w-full h-40 object-cover border border-white/10"
                      />
                    )}
                    <h2 className="text-xl font-semibold mb-2">
                      {post.title}
                    </h2>
                    <p className="text-white/60 text-sm line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-white/50">
                      {post.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.publishedAt).toLocaleDateString(
                            'en-GB',
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            }
                          )}
                        </span>
                      )}
                      {post.readingTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readingTime} min read
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </main>
  );
}
