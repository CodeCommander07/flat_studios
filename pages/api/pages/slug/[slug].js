// pages/api/pages/slug/[slug].js
import fs from 'fs'
import path from 'path'

const pagesFile = path.join(process.cwd(), 'data', 'pages.json')

const readPages = () => {
  try {
    if (!fs.existsSync(pagesFile)) {
      return []
    }
    const data = fs.readFileSync(pagesFile, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

export default function handler(req, res) {
  const { slug } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const pages = readPages()
  const page = pages.find(p => p.slug === slug)

  if (!page) {
    return res.status(404).json({ error: 'Page not found' })
  }

  res.status(200).json(page)
}