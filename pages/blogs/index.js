'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch("/api/pages");
        const data = await res.json();
        const filtered = data.filter((page) => page.isBlog);
        setBlogs(filtered);
      } catch (err) {
        console.error("Failed to load blogs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center text-gray-400 py-20">
        Loading blogs...
      </div>
    );
  }

  return (
    <section className="text-white py-16 px-6">
      <div className="max-w-4xl mx-auto text-center mb-12">
      <Breadcrumb />
        <h2 className="text-4xl font-extrabold mb-4">Latest Blogs & Updates</h2>
        <p className="text-gray-400 text-lg">
          Explore our recent posts, updates, and news articles.
        </p>
      </div>

      {blogs.length === 0 ? (
        <div className="text-center text-gray-500">No blogs found.</div>
      ) : (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {blogs.map((blog) => (
            <article
              key={blog.slug}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:scale-[1.01] hover:shadow-lg hover:shadow-purple-500/10 transition"
            >
              <div className="flex justify-between items-center text-sm text-gray-400 mb-3">
                <span>Authored By: {blog.author || "Unknown Author"}</span>
                <span>Last Updated: {new Date(blog.updatedAt).toLocaleDateString()}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex-1 pr-6">
                  <h3 className="text-xl font-semibold mb-2 text-white transition">
                    {blog.title}
                  </h3>
                  <p className="text-gray-300 mb-2 line-clamp-3">
                    {blog.excerpt || "No description available."}
                  </p>
                </div>

                <Link
                  href={`/blogs/${blog.slug}`}
                  className="text-purple-400 hover:text-purple-300 font-medium whitespace-nowrap"
                >
                  Read More →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
