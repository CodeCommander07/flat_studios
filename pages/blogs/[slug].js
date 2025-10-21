// pages/pages/[slug].js
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

export default function ViewPage() {
  const router = useRouter()
  const { slug } = router.query
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (slug) {
      loadPage(slug)
    }
  }, [slug])

  const loadPage = async (pageSlug) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/blogs/slug/${pageSlug}`)
      
      if (!response.ok) {
        throw new Error('Page not found')
      }
      
      const pageData = await response.json()
      
      // Only show published pages in production
      if (process.env.NODE_ENV === 'production' && !pageData.published) {
        throw new Error('Page not found')
      }
      
      setPage(pageData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading blog...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Blog Not Found</h1>
          <p className="text-gray-600 mb-4">The blog you're looking for doesn't exist.</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <article>
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              {page.title}
            </h1>
            <div className="flex items-center space-x-4 text-gray-500">
              <span>Last updated: {new Date(page.updatedAt).toLocaleDateString()}</span>
              <span>Author: {page.author}</span>
              <span>Category: {page.category}</span>
              {!page.published && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                  Draft
                </span>
              )}
            </div>
          </header>

          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
      </main>
    </div>
  )
}