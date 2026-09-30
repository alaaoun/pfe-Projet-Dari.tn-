import { useQuery, useMutation, useQueryClient } from 'react-query';
import { appointmentsApi } from '@/api/appointments.api';
import toast from 'react-hot-toast';

export function useCreateAppointment() {
  const qc = useQueryClient();

  return useMutation(appointmentsApi.create, {
    onSuccess: (data) => {
      qc.invalidateQueries('appointments');
      if (data?.payment_url) {
        window.location.assign(data.payment_url);
        return;
      }
      toast.success('Paiement créé.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la demande de visite.');
    },
  });
}

export function useMyAppointments() {
  return useQuery('appointmentsMy', appointmentsApi.getMyAppointments);
}

export function useAdminAppointments() {
  return useQuery('appointmentsAdmin', appointmentsApi.getMyAppointments, {
    staleTime: 5 * 60 * 1000,
  });
}

export function useAgentAppointments() {
  return useQuery('appointmentsAgent', appointmentsApi.getAgentAppointments);
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation(({ id, data }) => appointmentsApi.updateStatus(id, data), {
    onSuccess: () => {
      qc.invalidateQueries('appointmentsMy');
      qc.invalidateQueries('appointmentsAdmin');
      qc.invalidateQueries('appointmentsAgent');
      toast.success('Rendez-vous mis à jour.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Erreur de mise à jour du rendez-vous.');
    },
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation(appointmentsApi.cancel, {
    onSuccess: () => {
      qc.invalidateQueries('appointmentsMy');
      qc.invalidateQueries('appointmentsAdmin');
      qc.invalidateQueries('appointmentsAgent');
      toast.success('Rendez-vous annulé.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Erreur lors de l’annulation.');
    },
  });
}
