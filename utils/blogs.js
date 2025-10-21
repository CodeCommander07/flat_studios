// lib/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export const pageAPI = {
  // Get all pages
  getPages: () => api.get('/blogs'),
  
  // Get single page
  getPage: (id) => api.get(`/blogs/${id}`),
  
  // Create new page
  createPage: (data) => api.post('/blogs', data),
  
  // Update page
  updatePage: (id, data) => api.put(`/blogs/${id}`, data),
  
  // Delete page
  deletePage: (id) => api.delete(`/blogs/${id}`),
}