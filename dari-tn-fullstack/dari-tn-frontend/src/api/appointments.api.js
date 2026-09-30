import client from './client';

export const appointmentsApi = {
  create: (data) =>
    client.post('/api/payments/appointments', data).then(r => r.data.data),

  getMyAppointments: () =>
    client.get('/api/appointments/me').then(r => r.data.data),

  getAgentAppointments: () =>
    client.get('/api/appointments/agent').then(r => r.data.data),

  updateStatus: (id, data) =>
    client.patch(`/api/appointments/${id}/status`, data).then(r => r.data.data),

  cancel: (id) =>
    client.patch(`/api/appointments/${id}/cancel`).then(r => r.data.data),
};
