// components/admin/BlogList.js
import { useState, useEffect } from 'react'
import { pageAPI } from '@/utils/api'
import Link from 'next/link'

export default function BlogList({ onSelectBlog, initialBlogs = [] }) {
  const [blogs, setBlogs] = useState(initialBlogs)
  const [loading, setLoading] = useState(!initialBlogs.length)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, published, draft

  useEffect(() => {
    if (!initialBlogs.length) {
      loadBlogs()
    }
  }, [])

  const loadBlogs = async () => {
    try {
      setLoading(true)
      const response = await pageAPI.getPages()
      // Filter only blog posts
      const blogPosts = response.data.filter(page => page.isBlog)
      setBlogs(blogPosts)
    } catch (err) {
      setError('Failed to load blog posts')
      console.error('Error loading blogs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return
    
    try {
      await pageAPI.deletePage(id)
      setBlogs(blogs.filter(blog => blog.id !== id))
    } catch (err) {
      alert('Failed to delete blog post')
      console.error('Error deleting blog:', err)
    }
  }

  // Filter blogs based on status
  const filteredBlogs = blogs.filter(blog => {
    if (filter === 'published') return blog.published
    if (filter === 'draft') return !blog.published
    return true
  })

  if (loading) return <div className="text-center py-8 text-gray-400">Loading posts...</div>
  if (error) return <div className="text-center py-8 text-red-400">{error}</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Blog/News Posts</h2>
          <p className="text-gray-400 text-sm">Manage your content</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Posts</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
          
          <button
            onClick={() => onSelectBlog({ 
              title: '', 
              slug: '', 
              content: '', 
              published: false,
              isBlog: true,
              category: '',
              tags: '',
              author: '',
              excerpt: '',
              featuredImage: ''
            })}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Blog Post
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredBlogs.map((blog) => (
          <div key={blog.id} className="border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-white">{blog.title}</h3>
                    <p className="text-gray-400 text-sm">{blog.excerpt || 'No excerpt provided'}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {blog.featuredImage && (
                      <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden">
                        <img 
                          src={blog.featuredImage} 
                          alt="Featured" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 mt-2 flex-wrap gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    blog.published 
                      ? 'bg-green-900/50 text-green-400 border border-green-800' 
                      : 'bg-gray-700 text-gray-300 border border-gray-600'
                  }`}>
                    {blog.published ? 'Published' : 'Draft'}
                  </span>
                  
                  {blog.category && (
                    <span className="bg-blue-900/50 text-blue-400 px-2 py-1 rounded-full text-xs border border-blue-800">
                      {blog.category}
                    </span>
                  )}
                  
                  {blog.tags && blog.tags.split(',').map((tag, index) => (
                    <span 
                      key={index}
                      className="bg-purple-900/50 text-purple-400 px-2 py-1 rounded-full text-xs border border-purple-800"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                  
                  <span className="text-gray-500 text-sm">
                    {blog.author && `By ${blog.author} • `}
                    Updated: {new Date(blog.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2 ml-4">
                <Link 
                  href={`/blogs/${blog.slug}`}
                  target="_blank"
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors text-sm"
                >
                  View
                </Link>
                
                <button
                  onClick={() => onSelectBlog(blog)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Edit
                </button>
                
                <button
                  onClick={() => handleDelete(blog.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredBlogs.length === 0 && (
          <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No blog posts found</h3>
            <p className="text-gray-500 mb-4">
              {filter === 'published' 
                ? 'No published blog posts yet.' 
                : filter === 'draft'
                ? 'No draft blog posts.'
                : 'Get started by creating your first blog post!'
              }
            </p>
            <button
              onClick={() => onSelectBlog({ 
                title: '', 
                slug: '', 
                content: '', 
                published: false,
                isBlog: true 
              })}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Blog Post
            </button>
          </div>
        )}
      </div>
    </div>
  )
}