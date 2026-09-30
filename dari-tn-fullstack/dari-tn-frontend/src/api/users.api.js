import client from './client';

export const usersApi = {
  getAll: (params) =>
    client.get('/api/users', { params }).then((r) => r.data.data),

  updateStatus: (id, data) =>
    client.patch(`/api/users/${id}/status`, data).then((r) => r.data.data),
};
