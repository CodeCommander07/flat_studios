'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  FileText,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Filter,
  Search,
  Eye,
} from 'lucide-react';

/* ---------------------------------------------------------------------- */

export default function AdminContentDashboard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({ type: 'all', status: 'all' });
  const [refreshing, setRefreshing] = useState(false);

  /* Fetch all content */
  const fetchPosts = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (filter.type !== 'all') params.append('type', filter.type);
      if (filter.status !== 'all') params.append('status', filter.status);
      if (search) params.append('q', search);

      const res = await axios.get(`/api/content?${params.toString()}`);
      setPosts(res.data.items);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await axios.delete(`/api/content/${id}`);
      setPosts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete');
    }
  };

  /* ---------------------------------------------------------------------- */
  return (
    <main className="mt-5 p-8 max-w-6xl mx-auto text-white space-y-6 bg-[#283335] rounded-b-2xl rounded-r-2xl">
      <div className="flex justify-between items-center mb-4 ">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="text-cyan-400 w-7 h-7" /> Content Manager
        </h1>

        <Link
          href="/admin/content/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition"
        >
          <Plus className="w-4 h-4" /> New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          <select
            className="bg-black/30 border border-white/10 p-2 rounded-md text-white/80"
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          >
            <option className="text-white bg-black" value="all">All Types</option>
            <option className="text-white bg-black" value="article">Article</option>
            <option className="text-white bg-black" value="blog">Blog</option>
            <option className="text-white bg-black" value="guide">Guide</option>
            <option className="text-white bg-black" value="news">News</option>
            <option className="text-white bg-black" value="changelog">Changelog</option>
          </select>
          <select
            className="bg-black/30 border border-white/10 p-2 rounded-md text-white/80"
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <option className="text-white bg-black" value="all">All Statuses</option>
            <option className="text-white bg-black" value="draft">Draft</option>
            <option className="text-white bg-black" value="scheduled">Scheduled</option>
            <option className="text-white bg-black" value="published">Published</option>
            <option className="text-white bg-black" value="archived">Archived</option>
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Search className="w-4 h-4 text-cyan-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPosts()}
            className="p-2 rounded-md bg-black/30 border border-white/10 focus:border-cyan-400 outline-none text-white"
          />
          <button
            onClick={fetchPosts}
            className="p-2 rounded-md bg-[#283335] hover:bg-white/20 transition"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : 'text-white/70'}`}
            />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-white/70 border-b border-white/10">
              <th className="p-3">Title</th>
              <th className="p-3 hidden md:table-cell">Type</th>
              <th className="p-3 hidden md:table-cell">Status</th>
              <th className="p-3 hidden md:table-cell">Updated</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-white/60">
                  Loading posts...
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-white/60">
                  No posts found.
                </td>
              </tr>
            ) : (
              posts.map((post, i) => (
                <motion.tr
                  key={post._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-white/10 hover:bg-white/5 transition"
                >
                  <td className="p-3 font-medium text-white">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="hover:text-cyan-400 transition"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className="p-3 hidden md:table-cell text-white/60">
                    {post.type}
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <StatusBadge status={post.status} />
                  </td>
                  <td className="p-3 hidden md:table-cell text-white/50">
                    {new Date(post.updatedAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/content/${post._id}`}
                        className="p-2 rounded-md bg-blue-600 hover:bg-blue-500 transition"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(post._id, post.title)}
                        className="p-2 rounded-md bg-red-600 hover:bg-red-500 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="p-2 rounded-md bg-[#283335] hover:bg-white/20 transition"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------------- */
/* Status Badge */
function StatusBadge({ status }) {
  const colors = {
    draft: 'bg-gray-700 text-white/90',
    scheduled: 'bg-yellow-600 text-black',
    published: 'bg-green-600 text-black',
    archived: 'bg-red-600 text-white',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-600'}`}>
      {status.toUpperCase()}
    </span>
  );
}
