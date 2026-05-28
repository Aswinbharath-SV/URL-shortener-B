import api from './api';

const urlService = {
  // Shorten a single link
  shorten: async (payload) => {
    // payload: { originalUrl, customAlias, title, description }
    const response = await api.post('/urls', payload);
    return response.data;
  },

  // Fetch all shortened URLs for the active user with options
  getMyUrls: async (params = {}) => {
    // params: { search, sortBy, isActive }
    const response = await api.get('/urls', { params });
    return response.data;
  },

  // Update URL metadata (original link, title, desc, status)
  update: async (id, payload) => {
    const response = await api.put(`/urls/${id}`, payload);
    return response.data;
  },

  // Delete a URL and delete click history cascade
  delete: async (id) => {
    const response = await api.delete(`/urls/${id}`);
    return response.data;
  },

  // Bulk shorten from JSON array
  bulkUpload: async (urlsArray) => {
    // urlsArray: [ { originalUrl, customAlias, title, description } ]
    const response = await api.post('/urls/bulk', { urls: urlsArray });
    return response.data;
  }
};

export default urlService;
