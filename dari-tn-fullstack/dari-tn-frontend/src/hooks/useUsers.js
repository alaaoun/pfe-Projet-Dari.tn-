import { useQuery, useMutation, useQueryClient } from 'react-query';
import { usersApi } from '@/api/users.api';
import toast from 'react-hot-toast';

export function useAdminUsers(role = 'all', options = {}) {
  return useQuery(['adminUsers', role], () => {
    const params = role && role !== 'all' ? { role } : undefined;
    return usersApi.getAll(params);
  }, {
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation(({ id, data }) => usersApi.updateStatus(id, data), {
    onSuccess: () => {
      qc.invalidateQueries('adminUsers');
      toast.success('Utilisateur mis à jour.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour de l’utilisateur.');
    },
  });
}
