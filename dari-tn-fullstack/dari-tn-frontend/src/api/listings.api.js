import client from './client';

export const listingsApi = {
  getAll: (params) =>
    client.get('/api/listings', { params }).then(r => r.data.data),

  getOne: (slug) =>
    client.get(`/api/listings/${slug}`).then(r => r.data.data),

  create: (data) =>
    client.post('/api/listings', data).then(r => r.data.data),

  update: (id, data) =>
    client.put(`/api/listings/${id}`, data).then(r => r.data.data),

  delete: (id) =>
    client.delete(`/api/listings/${id}`).then(r => r.data),

  updateStatus: (id, status) =>
    client.patch(`/api/listings/${id}/status`, { status }).then(r => r.data.data),

  getMyListings: () =>
    client.get('/api/listings/user/me').then(r => r.data.data),

  sendMessage: (id, data) =>
    client.post(`/api/listings/${id}/message`, data).then(r => r.data),

  search: (params) =>
    client.get('/api/search', { params }).then(r => r.data.data),

  naturalSearch: (message) =>
    client.post('/api/search/natural', { message }).then(r => r.data.data),

  suggest: (q) =>
    client.get('/api/search/suggest', { params: { q } }).then(r => r.data.data),

  mapStats: (params) =>
    client.get('/api/search/map-stats', { params }).then(r => r.data.data),
};

export const uploadApi = {
  uploadImages: (listingId, files) => {
    const form = new FormData();
    files.forEach(f => form.append('images', f));
    return client.post(`/api/upload/listings/${listingId}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data.data);
  },
  deleteImage: (imageId) =>
    client.delete(`/api/upload/images/${imageId}`).then(r => r.data),
  setCover: (imageId) =>
    client.patch(`/api/upload/images/${imageId}/cover`).then(r => r.data),
};

export const favoritesApi = {
  getAll: () =>
    client.get('/api/favorites').then(r => r.data.data),
  toggle: (listingId) =>
    client.post(`/api/favorites/${listingId}`).then(r => r.data),
};
