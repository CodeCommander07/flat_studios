// pages/api/pages/[id].js
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

const writePages = (pages) => {
  fs.writeFileSync(pagesFile, JSON.stringify(pages, null, 2))
}

export default function handler(req, res) {
  const { id } = req.query

  if (req.method === 'GET') {
    const pages = readPages()
    const page = pages.find(p => p.id === id)
    if (!page) {
      return res.status(404).json({ error: 'Page not found' })
    }
    res.status(200).json(page)
  } else if (req.method === 'PUT') {
    const pages = readPages()
    const index = pages.findIndex(p => p.id === id)
    if (index === -1) {
      return res.status(404).json({ error: 'Page not found' })
    }
    
    pages[index] = {
      ...pages[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    }
    writePages(pages)
    res.status(200).json(pages[index])
  } else if (req.method === 'DELETE') {
    const pages = readPages()
    const filteredPages = pages.filter(p => p.id !== id)
    writePages(filteredPages)
    res.status(204).end()
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}