import { useQuery, useMutation, useQueryClient } from 'react-query';
import { listingsApi, favoritesApi } from '@/api/listings.api';
import toast from 'react-hot-toast';

export function useListings(params) {
  return useQuery(
    ['listings', params],
    () => listingsApi.getAll(params),
    { keepPreviousData: true }
  );
}

export function useListing(slug) {
  return useQuery(
    ['listing', slug],
    () => listingsApi.getOne(slug),
    { enabled: !!slug }
  );
}

export function useMyListings() {
  return useQuery('myListings', listingsApi.getMyListings);
}

export function useSearchListings(params) {
  return useQuery(
    ['search', params],
    () => listingsApi.search(params),
    { enabled: !!params?.q, keepPreviousData: true }
  );
}

export function useMapStats(params) {
  return useQuery(
    ['mapStats', params],
    () => listingsApi.mapStats(params),
    { staleTime: 5 * 60 * 1000 }
  );
}

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation(listingsApi.create, {
    onSuccess: () => {
      qc.invalidateQueries('listings');
      qc.invalidateQueries('myListings');
      toast.success('Annonce publiée !');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur lors de la publication.'),
  });
}

export function useUpdateListing() {
  const qc = useQueryClient();
  return useMutation(({ id, data }) => listingsApi.update(id, data), {
    onSuccess: (_, { id }) => {
      qc.invalidateQueries('listings');
      qc.invalidateQueries(['listing']);
      qc.invalidateQueries('myListings');
      qc.invalidateQueries(['listings', { admin: 'true' }]);
      toast.success('Annonce mise à jour !');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur de mise à jour.'),
  });
}

export function useUpdateListingStatus() {
  const qc = useQueryClient();
  return useMutation(({ id, status }) => listingsApi.updateStatus(id, status), {
    onSuccess: () => {
      qc.invalidateQueries('listings');
      qc.invalidateQueries('myListings');
      qc.invalidateQueries('adminListings');
      toast.success('Statut de l’annonce mis à jour.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour du statut.'),
  });
}

export function useDeleteListing() {
  const qc = useQueryClient();
  return useMutation(listingsApi.delete, {
    onSuccess: () => {
      qc.invalidateQueries('listings');
      qc.invalidateQueries('myListings');
      qc.invalidateQueries('adminListings');
      toast.success('Annonce supprimée.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur de suppression.'),
  });
}

export function useFavorites() {
  return useQuery('favorites', favoritesApi.getAll);
}

export function useAdminListings(status = 'pending') {
  return useQuery(['adminListings', status], () => listingsApi.getAll({ admin: 'true', status }), {
    staleTime: 5 * 60 * 1000,
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation(favoritesApi.toggle, {
    onSuccess: (data) => {
      qc.invalidateQueries('favorites');
      toast(data.favorited ? '❤️ Ajouté aux favoris' : 'Retiré des favoris');
    },
  });
}

export function useSendMessage() {
  return useMutation(({ id, data }) => listingsApi.sendMessage(id, data), {
    onSuccess: () => toast.success('Message envoyé ! L\'annonceur vous contactera bientôt.'),
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur d\'envoi.'),
  });
}
