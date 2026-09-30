import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Spinner from '@/components/common/Spinner';
import { useAuthStore } from '@/store/auth.store';

const HomePage       = lazy(() => import('@/pages/HomePage'));
const SearchPage     = lazy(() => import('@/pages/SearchPage'));
const ListingPage    = lazy(() => import('@/pages/ListingPage'));
const NewListingPage = lazy(() => import('@/pages/NewListingPage'));
const EditListingPage= lazy(() => import('@/pages/EditListingPage'));
const FavoritesPage  = lazy(() => import('@/pages/FavoritesPage'));
const ProfilePage    = lazy(() => import('@/pages/ProfilePage'));
const AdminPage      = lazy(() => import('@/pages/AdminPage'));
const AdminUsersPage = lazy(() => import('@/pages/AdminUsersPage'));
const ClientPage     = lazy(() => import('@/pages/ClientPage'));
const LoginPage      = lazy(() => import('@/pages/LoginPage'));
const RegisterPage   = lazy(() => import('@/pages/RegisterPage'));
const AppointmentsPage = lazy(() => import('@/pages/AppointmentsPage'));
const NotFoundPage   = lazy(() => import('@/pages/NotFoundPage'));

function PrivateRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/connexion" replace />;
}

function AdminRoute({ children }) {
  const { token, isAdmin } = useAuthStore();
  if (!token) return <Navigate to="/connexion" replace />;
  return isAdmin() ? children : <Navigate to="/client" replace />;
}

function GuestRoute({ children }) {
  const { token } = useAuthStore();
  return !token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}><Spinner size={40} /></div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="recherche" element={<SearchPage />} />
          <Route path="annonce/:slug" element={<ListingPage />} />

          <Route path="publier" element={
            <PrivateRoute><NewListingPage /></PrivateRoute>
          } />
          <Route path="annonce/:slug/modifier" element={
            <PrivateRoute><EditListingPage /></PrivateRoute>
          } />
          <Route path="favoris" element={
            <PrivateRoute><FavoritesPage /></PrivateRoute>
          } />
          <Route path="rendez-vous" element={
            <PrivateRoute><AppointmentsPage /></PrivateRoute>
          } />
          <Route path="profil" element={
            <PrivateRoute><ProfilePage /></PrivateRoute>
          } />
          <Route path="client" element={
            <PrivateRoute><ClientPage /></PrivateRoute>
          } />
          <Route path="admin" element={
            <AdminRoute><AdminPage /></AdminRoute>
          } />
          <Route path="admin/users" element={
            <AdminRoute><AdminUsersPage /></AdminRoute>
          } />

          <Route path="connexion" element={
            <GuestRoute><LoginPage /></GuestRoute>
          } />
          <Route path="inscription" element={
            <GuestRoute><RegisterPage /></GuestRoute>
          } />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
