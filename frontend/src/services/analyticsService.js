import api from './api';

const analyticsService = {
  // Get aggregated user dashboard analytics
  getDashboard: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  // Get in-depth metrics for one URL
  getUrlDetail: async (id) => {
    const response = await api.get(`/analytics/url/${id}`);
    return response.data;
  },

  // Get public statistics for any active short code
  getPublicDetail: async (shortCode) => {
    const response = await api.get(`/analytics/public/${shortCode}`);
    return response.data;
  },

  // Download analytics log CSV with JWT injection
  exportCSV: async (id, shortCode) => {
    try {
      const response = await api.get(`/analytics/export/${id}`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `analytics-${shortCode}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to export analytics CSV:', error.message);
      throw new Error('CSV Export failed');
    }
  }
};

export default analyticsService;
