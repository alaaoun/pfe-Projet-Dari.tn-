import { useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  return useMutation(authApi.login, {
    onSuccess: (data) => {
      setAuth(data);
      toast.success(`Bienvenue ${data.user.first_name} !`);
      const redirectPath = data.user?.role === 'admin' ? '/admin' : '/client';
      navigate(redirectPath);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Identifiants incorrects.'),
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  return useMutation(authApi.register, {
    onSuccess: (data) => {
      setAuth(data);
      toast.success('Compte créé avec succès !');
      navigate('/');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur lors de l\'inscription.'),
  });
}

export function useUpdateProfile() {
  const { setUser } = useAuthStore();
  return useMutation(authApi.updateProfile, {
    onSuccess: (user) => { setUser(user); toast.success('Profil mis à jour !'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur de mise à jour.'),
  });
}

export function useChangePassword() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  return useMutation(authApi.changePassword, {
    onSuccess: () => {
      toast.success('Mot de passe modifié. Reconnectez-vous.');
      logout();
      navigate('/connexion');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur.'),
  });
}
