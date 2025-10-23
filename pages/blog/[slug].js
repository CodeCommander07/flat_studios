'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { motion } from 'framer-motion';
import { Calendar, Clock, Tag, Share2 } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';

export default function BlogPostPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    const loadPost = async () => {
      try {
        const res = await fetch(`/api/content/slug/${slug}`);
        if (!res.ok) throw new Error('Post not found');
        const data = await res.json();
        setPost(data);
      } catch (e) {
        setError(e.message);
      }
    };
    loadPost();
  }, [slug]);

  if (error) {
    return (
      <main className="p-6 text-center text-red-400">
        <p>{error}</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="p-6 text-center text-white/60">
        <p>Loading article...</p>
      </main>
    );
  }

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* SEO Head */}
      <head>
        <title>{post.seo?.title || post.title}</title>
        {post.seo?.description && <meta name="description" content={post.seo.description} />}
        {post.seo?.canonicalUrl && <link rel="canonical" href={post.seo.canonicalUrl} />}
        {post.seo?.noIndex && <meta name="robots" content="noindex,nofollow" />}
      </head>

      <main className="max-w-4xl mx-auto px-6 md:px-8 lg:px-12 py-10 text-white">
        {/* Cover */}
        {post.coverImage?.url && (
          <motion.img
            src={post.coverImage.url}
            alt={post.coverImage.alt || post.title}
            className="rounded-2xl w-full max-h-[450px] object-cover mb-8 border border-white/10 shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          />
        )}

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <Breadcrumb />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">{post.excerpt}</p>

          <div className="flex justify-center items-center gap-4 mt-4 text-white/60 text-sm">
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> {formattedDate}
              </span>
            )}
            {post.readingTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {post.readingTime} min read
              </span>
            )}
            <button
              onClick={handleShare}
              className="flex items-center gap-1 hover:text-cyan-400 transition"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </motion.header>

        {/* Author */}
        {post.author?.name && (
          <div className="flex items-center justify-center gap-3 mb-10">
            {post.author.avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <Image
                src={post.author.avatar}
                alt={post.author.name}
                className="w-10 h-10 rounded-full border border-white/20"
              />
            )}
            <span className="text-white/70">{post.author.name}</span>
          </div>
        )}

        {/* Body */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-invert prose-lg max-w-none leading-relaxed"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
            {post.content}
          </ReactMarkdown>
        </motion.article>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-white/10">
            {post.tags.map((t) => (
              <span
                key={t}
                className="px-3 py-1 text-sm rounded-full bg-white/10 hover:bg-white/20 transition flex items-center gap-1"
              >
                <Tag className="w-3 h-3 text-cyan-400" /> {t}
              </span>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
