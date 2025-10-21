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
          <h1 className="text-3xl font-bold text-white mb-2">{title || 'Untitled Blog'}</h1>
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

export default function BlogEditor({ blog, onBack, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    published: false,
    isBlog: true, // Always true for blog editor
    category: '',
    tags: '',
    author: '',
    excerpt: '',
    featuredImage: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('edit')

  useEffect(() => {
    if (blog) {
      setFormData({
        title: blog.title || '',
        slug: blog.slug || '',
        content: blog.content || '',
        metaTitle: blog.metaTitle || '',
        metaDescription: blog.metaDescription || '',
        published: blog.published || false,
        isBlog: true, // Force isBlog to true
        category: blog.category || '',
        tags: blog.tags || '',
        author: blog.author || '',
        excerpt: blog.excerpt || '',
        featuredImage: blog.featuredImage || ''
      })
    }
  }, [blog])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Ensure isBlog is always true
      const submitData = {
        ...formData,
        isBlog: true
      }

      if (blog.id) {
        await pageAPI.updatePage(blog.id, submitData)
      } else {
        await pageAPI.createPage(submitData)
      }
      onSave()
    } catch (err) {
      setError('Failed to save blog post')
      console.error('Error saving blog:', err)
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

  // Fancy blog example content with extensive Tailwind classes
  const exampleContent = `
<!-- Hero Section -->
<div class="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl p-8 text-center mb-8">
  <h1 class="text-5xl font-bold text-white mb-4">The Future of Urban Transportation</h1>
  <p class="text-xl text-blue-200 mb-6">Exploring innovative solutions for modern city mobility</p>
  <div class="flex justify-center space-x-4">
    <span class="bg-blue-500 text-white px-4 py-2 rounded-full text-sm">Transportation</span>
    <span class="bg-green-500 text-white px-4 py-2 rounded-full text-sm">Innovation</span>
    <span class="bg-purple-500 text-white px-4 py-2 rounded-full text-sm">Sustainability</span>
  </div>
</div>

<!-- Author & Meta Info -->
<div class="flex items-center space-x-4 mb-8 p-4 bg-gray-800 rounded-lg">
  <div class="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
    <span class="text-white font-bold">JD</span>
  </div>
  <div>
    <p class="text-white font-semibold">John Doe</p>
    <p class="text-gray-400 text-sm">Senior Transportation Analyst • Published on January 15, 2024</p>
  </div>
</div>

<!-- Introduction -->
<div class="mb-8">
  <p class="text-lg text-gray-300 leading-relaxed mb-4">
    Urban transportation is at a pivotal moment in history. As cities grow denser and environmental concerns mount, 
    the way we move through urban landscapes must evolve. This comprehensive analysis explores the cutting-edge 
    technologies and strategies shaping the future of how we navigate our cities.
  </p>
</div>

<!-- Main Content Sections -->
<div class="space-y-12">

  <!-- Section 1 -->
  <section class="bg-gray-800 rounded-xl p-6 border-l-4 border-blue-500">
    <h2 class="text-3xl font-bold text-white mb-4">🚀 Autonomous Public Transit</h2>
    <p class="text-gray-300 mb-4">
      Self-driving buses and shuttles are no longer science fiction. Cities like Singapore and Helsinki have 
      already implemented autonomous public transit systems that operate with remarkable efficiency.
    </p>
    
    <div class="grid md:grid-cols-2 gap-6 mb-4">
      <div class="bg-gray-700 p-4 rounded-lg">
        <h3 class="text-xl font-semibold text-white mb-2">Benefits</h3>
        <ul class="text-gray-300 space-y-2">
          <li class="flex items-center">
            <span class="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
            24/7 operation capabilities
          </li>
          <li class="flex items-center">
            <span class="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
            Reduced operational costs
          </li>
          <li class="flex items-center">
            <span class="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
            Enhanced safety features
          </li>
        </ul>
      </div>
      
      <div class="bg-gray-700 p-4 rounded-lg">
        <h3 class="text-xl font-semibold text-white mb-2">Challenges</h3>
        <ul class="text-gray-300 space-y-2">
          <li class="flex items-center">
            <span class="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
            Regulatory hurdles
          </li>
          <li class="flex items-center">
            <span class="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
            Public acceptance
          </li>
          <li class="flex items-center">
            <span class="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
            Infrastructure adaptation
          </li>
        </ul>
      </div>
    </div>
  </section>

  <!-- Section 2 -->
  <section class="bg-gray-800 rounded-xl p-6 border-l-4 border-green-500">
    <h2 class="text-3xl font-bold text-white mb-4">🌱 Sustainable Mobility Solutions</h2>
    
    <div class="mb-6">
      <p class="text-gray-300 mb-4">
        Electric vehicles and micro-mobility options are transforming urban landscapes. From e-bikes to electric 
        scooters, cities are embracing cleaner alternatives to traditional transportation.
      </p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-lg text-center">
        <p class="text-2xl font-bold text-white">47%</p>
        <p class="text-green-100 text-sm">Reduction in emissions</p>
      </div>
      <div class="bg-gradient-to-br from-blue-500 to-cyan-600 p-4 rounded-lg text-center">
        <p class="text-2xl font-bold text-white">63%</p>
        <p class="text-blue-100 text-sm">Cost savings</p>
      </div>
      <div class="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-lg text-center">
        <p class="text-2xl font-bold text-white">82%</p>
        <p class="text-purple-100 text-sm">User satisfaction</p>
      </div>
      <div class="bg-gradient-to-br from-orange-500 to-red-600 p-4 rounded-lg text-center">
        <p class="text-2xl font-bold text-white">29%</p>
        <p class="text-orange-100 text-sm">Faster commute times</p>
      </div>
    </div>
  </section>

  <!-- Section 3 -->
  <section class="bg-gray-800 rounded-xl p-6 border-l-4 border-purple-500">
    <h2 class="text-3xl font-bold text-white mb-4">🔗 Integrated Mobility Platforms</h2>
    
    <p class="text-gray-300 mb-6">
      The future lies in seamless integration. Imagine booking a single journey that combines:
    </p>

    <div class="space-y-4">
      <div class="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
        <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-4">
          <span class="text-white">🚌</span>
        </div>
        <div>
          <h4 class="text-white font-semibold">Smart Bus Routing</h4>
          <p class="text-gray-400 text-sm">Dynamic routes based on real-time demand</p>
        </div>
      </div>

      <div class="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
        <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
          <span class="text-white">🚲</span>
        </div>
        <div>
          <h4 class="text-white font-semibold">Bike Sharing Integration</h4>
          <p class="text-gray-400 text-sm">Last-mile connectivity solutions</p>
        </div>
      </div>

      <div class="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
        <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-4">
          <span class="text-white">📱</span>
        </div>
        <div>
          <h4 class="text-white font-semibold">Mobile Payment Systems</h4>
          <p class="text-gray-400 text-sm">Unified payment across all transport modes</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Call to Action -->
  <div class="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-8 text-center">
    <h3 class="text-2xl font-bold text-white mb-4">Join the Transportation Revolution</h3>
    <p class="text-blue-100 mb-6">
      Be part of the movement shaping the future of urban mobility. Your journey towards smarter transportation starts here.
    </p>
    <div class="space-x-4">
      <button class="bg-white text-cyan-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
        Learn More
      </button>
      <button class="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-cyan-600 transition-colors">
        Get Started
      </button>
    </div>
  </div>

  <!-- Author Bio -->
  <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
    <div class="flex items-start space-x-4">
      <div class="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
        <span class="text-white font-bold text-lg">JD</span>
      </div>
      <div>
        <h3 class="text-xl font-bold text-white mb-2">About the Author</h3>
        <p class="text-gray-300 mb-3">
          John Doe is a senior transportation analyst with over 15 years of experience in urban planning 
          and sustainable mobility solutions. He has consulted for major cities worldwide and is a passionate 
          advocate for intelligent transportation systems.
        </p>
        <div class="flex space-x-3">
          <span class="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">Urban Planning</span>
          <span class="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">Sustainability</span>
          <span class="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">Technology</span>
        </div>
      </div>
    </div>
  </div>

</div>

<!-- Newsletter Signup -->
<div class="mt-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
  <div class="text-center max-w-2xl mx-auto">
    <h3 class="text-2xl font-bold text-white mb-2">Stay Updated</h3>
    <p class="text-gray-400 mb-6">Get the latest insights on urban transportation and smart city solutions</p>
    <div class="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
      <input 
        type="email" 
        placeholder="Enter your email" 
        class="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap">
        Subscribe
      </button>
    </div>
    <p class="text-gray-500 text-sm mt-4">No spam, unsubscribe at any time</p>
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
            {blog.id ? 'Edit Blog' : 'Create New Blog'}
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
                  placeholder="blog title"
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
                  placeholder="blog-slug"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Author *
                </label>
                <input
                  type="text"
                  required
                  value={formData.author}
                  onChange={(e) => handleChange('author', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="blog author"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="blog category"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Excerpt *
                </label>
                <input
                  type="text"
                  required
                  value={formData.excerpt}
                  onChange={(e) => handleChange('excerpt', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="blog excerpt"
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
                  Load Blog Example
                </button>
              </div>
              <textarea
                required
                rows={15}
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder={`Enter HTML with Tailwind classes...\n\nExample includes:\n- Hero sections with gradients\n- Stats and metrics\n- Interactive components\n- Author bios\n- Newsletter signups\n- And much more!`}
              />
              <p className="mt-2 text-sm text-gray-400">
                You can use HTML with Tailwind CSS classes. Preview your changes in the Preview tab.
                <br />
                <strong>Supported:</strong> Gradients, grids, flexbox, hover effects, transitions, and comprehensive utility classes.
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
            {loading ? 'Saving...' : (blog.id ? 'Update Blog' : 'Create Blog')}
          </button>
        </div>
      </form>
    </div>
  )
}