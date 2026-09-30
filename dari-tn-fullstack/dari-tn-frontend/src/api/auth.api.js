import client from './client';

export const authApi = {
  register: (data) =>
    client.post('/api/auth/register', data).then(r => r.data.data),

  login: (data) =>
    client.post('/api/auth/login', data).then(r => r.data.data),

  logout: (refreshToken) =>
    client.post('/api/auth/logout', { refreshToken }).then(r => r.data),

  me: () =>
    client.get('/api/auth/me').then(r => r.data.data),

  changePassword: (data) =>
    client.put('/api/auth/change-password', data).then(r => r.data),

  updateProfile: (data) =>
    client.put('/api/users/profile', data).then(r => r.data.data),
};
