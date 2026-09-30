import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import styles from './ClientPage.module.css';

const ACTIONS = [
  { to: '/profil', label: 'Mon profil', description: 'Voir et modifier vos informations personnelles' },
  { to: '/rendez-vous', label: 'Mes rendez-vous', description: 'Consulter vos rendez-vous et contacts' },
  { to: '/favoris', label: 'Mes favoris', description: 'Retrouver vos annonces enregistrées' },
  { to: '/publier', label: 'Publier une annonce', description: 'Créer une annonce si vous souhaitez vendre ou louer' },
  { to: '/recherche', label: 'Recherche', description: 'Parcourir les annonces disponibles' },
];

export default function ClientPage() {
  const { user } = useAuthStore();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.tag}>Espace client</p>
          <h1>Bonjour, {user?.first_name || 'Utilisateur'}</h1>
          <p className={styles.description}>
            Voici les actions que vous pouvez réaliser. En tant que client, vous avez accès à vos favoris, vos rendez-vous et votre profil.
          </p>
        </div>
      </header>

      <div className={styles.grid}>
        {ACTIONS.map((action) => (
          <Link key={action.to} to={action.to} className={styles.card}>
            <strong className={styles.cardTitle}>{action.label}</strong>
            <p className={styles.cardText}>{action.description}</p>
            <span className={styles.cardLink}>Aller →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
