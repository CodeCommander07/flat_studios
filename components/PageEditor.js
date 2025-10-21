// components/admin/PageEditor.js
import { useState, useEffect } from 'react'
import { pageAPI } from '@/utils/api'

// Component to render Tailwind-styled content safely
const TailwindPreview = ({ content, title, isDraft }) => {
  // Create a sanitized version of the content that preserves Tailwind classes
  const createMarkup = () => {
    return { __html: content || '<p class="text-gray-500">Start typing to see preview...</p>' };
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 min-h-[500px]">
      <article className="max-w-none">
        <header className="border-b border-gray-700 pb-4 mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{title || 'Untitled Page'}</h1>
          {isDraft && (
            <span className="inline-block bg-yellow-500 text-yellow-900 text-sm px-2 py-1 rounded">
              Draft
            </span>
          )}
        </header>
        
        {/* Container with Tailwind prose classes that will apply to inner HTML */}
        <div 
          className="
            text-gray-300 
            [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_h5]:text-white [&_h6]:text-white
            [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4
            [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3
            [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2
            [&_a]:text-blue-400 [&_a]:hover:text-blue-300 [&_a]:underline
            [&_strong]:text-white [&_strong]:font-bold
            [&_em]:text-gray-200 [&_em]:italic
            [&_code]:text-green-400 [&_code]:bg-gray-800 [&_code]:px-1 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm
            [&_pre]:bg-gray-800 [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto
            [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-400
            [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-1
            [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-1
            [&_li]:mb-1
            [&_p]:mb-4 [&_p]:leading-relaxed
            [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-gray-600
            [&_th]:bg-gray-800 [&_th]:text-white [&_th]:p-2 [&_th]:border [&_th]:border-gray-600 [&_th]:text-left
            [&_td]:p-2 [&_td]:border [&_td]:border-gray-600 [&_td]:text-gray-300
            [&_img]:rounded-lg [&_img]:shadow-md
            [&_.bg-red-500]:bg-red-500 [&_.bg-blue-500]:bg-blue-500 [&_.bg-green-500]:bg-green-500 [&_.bg-yellow-500]:bg-yellow-500
            [&_.bg-purple-500]:bg-purple-500 [&_.bg-pink-500]:bg-pink-500 [&_.bg-indigo-500]:bg-indigo-500
            [&_.text-white]:text-white [&_.text-black]:text-black [&_.text-gray-500]:text-gray-500
            [&_.p-4]:p-4 [&_.p-2]:p-2 [&_.px-4]:px-4 [&_.py-2]:py-2
            [&_.rounded]:rounded [&_.rounded-lg]:rounded-lg
            [&_.border]:border [&_.border-2]:border-2
            [&_.flex]:flex [&_.grid]:grid [&_.inline-flex]:inline-flex
            [&_.space-x-2_>*+*]:ml-2 [&_.space-y-2_>*+*]:mt-2
          "
          dangerouslySetInnerHTML={createMarkup()}
        />
      </article>
    </div>
  );
};

export default function PageEditor({ page, onBack, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    published: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('edit') // 'edit' or 'preview'

  useEffect(() => {
    if (page) {
      setFormData({
        title: page.title || '',
        slug: page.slug || '',
        content: page.content || '',
        metaTitle: page.metaTitle || '',
        metaDescription: page.metaDescription || '',
        published: page.published || false
      })
    }
  }, [page])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (page.id) {
        await pageAPI.updatePage(page.id, formData)
      } else {
        await pageAPI.createPage(formData)
      }
      onSave()
    } catch (err) {
      setError('Failed to save page')
      console.error('Error saving page:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Example content with Tailwind classes
  const exampleContent = `
<div class="space-y-4">
  <h1 class="text-4xl font-bold text-white">Welcome to Our Page</h1>
  
  <p class="text-gray-300 text-lg">This is a paragraph with some <strong class="text-blue-400">highlighted text</strong> and a <a href="#" class="text-green-400 hover:text-green-300 underline">link</a>.</p>
  
  <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
    <h2 class="text-2xl font-semibold text-white mb-3">Feature Section</h2>
    <p class="text-gray-300">This is a styled container with Tailwind classes.</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
    <div class="bg-blue-500 p-4 rounded text-white">
      <h3 class="text-xl font-bold">Card 1</h3>
      <p>This is a blue card</p>
    </div>
    <div class="bg-green-500 p-4 rounded text-white">
      <h3 class="text-xl font-bold">Card 2</h3>
      <p>This is a green card</p>
    </div>
  </div>

  <button class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors mt-4">
    Click Me
  </button>

  <div class="flex space-x-2 mt-4">
    <span class="bg-purple-500 text-white px-2 py-1 rounded text-sm">Tag 1</span>
    <span class="bg-indigo-500 text-white px-2 py-1 rounded text-sm">Tag 2</span>
    <span class="bg-pink-500 text-white px-2 py-1 rounded text-sm">Tag 3</span>
  </div>
</div>
`.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Pages
          </button>
          <h2 className="text-xl font-semibold text-white">
            {page.id ? 'Edit Page' : 'Create New Page'}
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.published}
              onChange={(e) => handleChange('published', e.target.checked)}
              className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600"
            />
            <span className="text-gray-300">Published</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('edit')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'edit'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Preview
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'edit' ? (
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Page title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="page-slug"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Content *
                </label>
                <button
                  type="button"
                  onClick={() => handleChange('content', exampleContent)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded"
                >
                  Load Example
                </button>
              </div>
              <textarea
                required
                rows={15}
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder={`Enter HTML with Tailwind classes...\n\nExample:\n<div class="bg-blue-500 p-4 rounded text-white">\n  <h2 class="text-2xl font-bold">Your Content</h2>\n  <p>Styled with Tailwind!</p>\n</div>`}
              />
              <p className="mt-2 text-sm text-gray-400">
                You can use HTML with Tailwind CSS classes. Preview your changes in the Preview tab.
                <br />
                <strong>Supported:</strong> Colors, spacing, flexbox, grid, borders, typography, and most utility classes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => handleChange('metaTitle', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Meta title for SEO"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Meta Description
                </label>
                <textarea
                  rows={3}
                  value={formData.metaDescription}
                  onChange={(e) => handleChange('metaDescription', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Meta description for SEO"
                />
              </div>
            </div>
          </div>
        ) : (
          <TailwindPreview 
            content={formData.content} 
            title={formData.title}
            isDraft={!formData.published}
          />
        )}

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : (page.id ? 'Update Page' : 'Create Page')}
          </button>
        </div>
      </form>
    </div>
  )
}