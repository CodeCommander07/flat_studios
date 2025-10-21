// pages/api/pages/index.js
import fs from 'fs'
import path from 'path'

const pagesFile = path.join(process.cwd(), 'data', 'pages.json')

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(pagesFile)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Read pages from file
const readPages = () => {
  try {
    ensureDataDir()
    if (!fs.existsSync(pagesFile)) {
      return []
    }
    const data = fs.readFileSync(pagesFile, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Write pages to file
const writePages = (pages) => {
  ensureDataDir()
  fs.writeFileSync(pagesFile, JSON.stringify(pages, null, 2))
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    const pages = readPages()
    res.status(200).json(pages)
  } else if (req.method === 'POST') {
    const pages = readPages()
    const newPage = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    pages.push(newPage)
    writePages(pages)
    res.status(201).json(newPage)
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}