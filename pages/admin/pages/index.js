// pages/admin/pages/index.js
import { useState } from 'react'
import PageList from '@/components/PageList'
import BlogList from '@/components/BlogList'
import PageEditor from '@/components/PageEditor'
import BlogEditor from '@/components/BlogEditor'
import AuthWrapper from '@/components/AuthWrapper'

export default function AdminPages() {
  const [selectedContent, setSelectedContent] = useState(null)
  const [view, setView] = useState('list') // 'list' or 'edit'
  const [activeTab, setActiveTab] = useState('pages') // 'pages' or 'blogs'
  const [editingType, setEditingType] = useState('page') // 'page' or 'blog'

  const handleSelectPage = (page) => {
    setSelectedContent(page)
    setEditingType('page')
    setView('edit')
  }

  const handleSelectBlog = (blog) => {
    setSelectedContent(blog)
    setEditingType('blog')
    setView('edit')
  }

  const handleBack = () => {
    setSelectedContent(null)
    setView('list')
    setEditingType('page') // Reset to default
  }

  const handleSave = () => {
    setSelectedContent(null)
    setView('list')
    setEditingType('page') // Reset to default
  }

  return (
    <AuthWrapper requiredRole="admin">
    <div className="text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <h1 className="text-2xl font-bold text-white">Content Management</h1>
            <p className="text-gray-400">Manage pages, blogs and news posts</p>
          </div>
          
          {/* Tab Navigation */}
          <div className="p-6">
            {view === 'list' && (
              <div className="border-b border-gray-700 mb-6">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('pages')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'pages'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Pages
                  </button>
                  <button
                    onClick={() => setActiveTab('blogs')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'blogs'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Blog/News Posts
                  </button>
                </nav>
              </div>
            )}
            
            {view === 'list' ? (
              activeTab === 'pages' ? (
                <PageList 
                  onSelectPage={handleSelectPage}
                />
              ) : (
                <BlogList 
                  onSelectBlog={handleSelectBlog}
                />
              )
            ) : editingType === 'page' ? (
              <PageEditor 
                page={selectedContent}
                onBack={handleBack}
                onSave={handleSave}
              />
            ) : (
              <BlogEditor 
                blog={selectedContent}
                onBack={handleBack}
                onSave={handleSave}
              />
            )}
          </div>
        </div>
      </div>
    </div>
    </AuthWrapper>
  )
}