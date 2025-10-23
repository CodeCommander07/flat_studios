import mongoose from 'mongoose';

const RevisionSchema = new mongoose.Schema({
  editedAt: { type: Date, default: Date.now },
  editorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: String,
  diff: mongoose.Schema.Types.Mixed, // store changes or snapshot
}, { _id: false });

const ContentSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['article','blog','guide','news','changelog','page'], 
    default: 'article',
    index: true
  },

  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },

  excerpt: { type: String, default: '' }, // short summary for cards/SEO
  content: { type: String, required: true }, // markdown or MDX

  coverImage: {
    url: String,
    alt: String,
    width: Number,
    height: Number,
  },

  tags: { type: [String], index: true },
  categories: { type: [String], index: true },

  status: { 
    type: String, 
    enum: ['draft','scheduled','published','archived'], 
    default: 'draft',
    index: true
  },

  scheduledFor: { type: Date, index: true }, // when to auto-publish
  publishedAt: { type: Date, index: true },
  visibility: { type: String, enum: ['public','unlisted','private'], default: 'public' },

  author: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    avatar: String
  },

  readingTime: { type: Number, default: 0 }, // minutes
  wordCount: { type: Number, default: 0 },

  seo: {
    title: String,
    description: String,
    canonicalUrl: String,
    noIndex: { type: Boolean, default: false }
  },

  revisions: [RevisionSchema],

  // Auditing
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

ContentSchema.index({ title: 'text', excerpt: 'text', content: 'text', tags: 'text', categories: 'text' });

function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 96);
}

// Auto-generate slug & reading-time/word-count
ContentSchema.pre('validate', function(next) {
  if (!this.slug && this.title) this.slug = slugify(this.title);
  if (this.isModified('content')) {
    const words = this.content?.split(/\s+/).filter(Boolean) ?? [];
    this.wordCount = words.length;
    this.readingTime = Math.max(1, Math.round(words.length / 200));
  }
  next();
});

export default mongoose.models.Content || mongoose.model('Content', ContentSchema);
