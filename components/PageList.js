// components/admin/PageList.js
import { useState, useEffect } from 'react'
import { pageAPI } from '@/utils/api'
import Link from 'next/link'

export default function PageList({ onSelectPage }) {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPages()
  }, [])

  const loadPages = async () => {
    try {
      setLoading(true)
      const response = await pageAPI.getPages()
      // Filter out blog posts - only show regular pages
      const regularPages = response.data.filter(page => !page.isBlog)
      setPages(regularPages)
    } catch (err) {
      setError('Failed to load pages')
      console.error('Error loading pages:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this page?')) return
    
    try {
      await pageAPI.deletePage(id)
      setPages(pages.filter(page => page.id !== id))
    } catch (err) {
      alert('Failed to delete page')
      console.error('Error deleting page:', err)
    }
  }

  if (loading) return <div className="text-center py-8 text-gray-400">Loading pages...</div>
  if (error) return <div className="text-center py-8 text-red-400">{error}</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Pages</h2>
          <p className="text-gray-400 text-sm">Manage your pages</p>
        </div>
        <button
          onClick={() => onSelectPage({ title: '', slug: '', content: '', published: false })}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Page
        </button>
      </div>

      <div className="space-y-4">
        {pages.map((page) => (
          <div key={page.id} className="border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-white">{page.title}</h3>
                <p className="text-gray-400 text-sm">/{page.slug}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    page.published 
                      ? 'bg-green-900/50 text-green-400 border border-green-800' 
                      : 'bg-gray-700 text-gray-300 border border-gray-600'
                  }`}>
                    {page.published ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-gray-500 text-sm">
                    Updated: {new Date(page.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Link 
                  href={`/${page.slug}`}
                  target="_blank"
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                >
                  View
                </Link>
                
                <button
                  onClick={() => onSelectPage(page)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
                
                <button
                  onClick={() => handleDelete(page.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {pages.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
            No pages found. Create your first page!
          </div>
        )}
      </div>
    </div>
  )
}