'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';

export default function BlogIndex() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const res = await fetch('/api/content?q=&type=blog&status=published');
        if (!res.ok) throw new Error('Failed to load posts');
        const data = await res.json();
        setPosts(data.items);
      } catch (e) {
        setError(e.message);
      }
    };
    loadPosts();
  }, []);

  if (error) return <p className="text-red-400 p-6 text-center">{error}</p>;

  return (
    <main className="max-w-5xl mx-auto p-6 text-white space-y-8">
      <h1 className="text-4xl font-bold text-center mb-10">📰 Our Blog</h1>

      {posts.length === 0 && (
        <p className="text-white/60 text-center">No published posts yet.</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                <p className="text-white/60 text-sm line-clamp-2 mb-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-3 text-xs text-white/50">
                  {post.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.publishedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
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
      </div>
    </main>
  );
}
