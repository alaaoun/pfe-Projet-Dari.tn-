import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useListings';
import ListingCard from '@/components/listings/ListingCard';
import Spinner from '@/components/common/Spinner';
import styles from './FavoritesPage.module.css';

export default function FavoritesPage() {
  const { data: listings = [], isLoading } = useFavorites();

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Heart size={24} className={styles.icon} />
            <div>
              <h1 className={styles.title}>Mes favoris</h1>
              <p className={styles.sub}>{listings.length} annonce(s) sauvegardée(s)</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loading}><Spinner size={36} /></div>
        ) : listings.length === 0 ? (
          <div className={styles.empty}>
            <Heart size={56} className={styles.emptyIcon} />
            <h2>Aucun favori pour l'instant</h2>
            <p>Parcourez les annonces et cliquez sur le cœur pour sauvegarder vos coups de cœur.</p>
            <Link to="/recherche" className={styles.browseBtn}>
              Parcourir les annonces →
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {listings.map((listing, i) => (
              <div key={listing.id} className={`animate-fade-up stagger-${Math.min(i % 5 + 1, 5)}`}>
                <ListingCard listing={listing} isFavorited={true} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
