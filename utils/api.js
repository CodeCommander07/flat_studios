// lib/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export const pageAPI = {
  // Get all pages
  getPages: () => api.get('/pages'),
  
  // Get single page
  getPage: (id) => api.get(`/pages/${id}`),
  
  // Create new page
  createPage: (data) => api.post('/pages', data),
  
  // Update page
  updatePage: (id, data) => api.put(`/pages/${id}`, data),
  
  // Delete page
  deletePage: (id) => api.delete(`/pages/${id}`),
}