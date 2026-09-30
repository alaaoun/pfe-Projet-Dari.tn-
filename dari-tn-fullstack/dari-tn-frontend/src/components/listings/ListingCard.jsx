import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, BedDouble, Bath, Maximize2, Car } from 'lucide-react';
import { formatPrice, formatRelativeDate } from '@/utils/format';
import { useToggleFavorite } from '@/hooks/useListings';
import { useAuthStore } from '@/store/auth.store';
import styles from './ListingCard.module.css';

const EMOJI_MAP = {
  Appartement: '🏢', Villa: '🏡', Maison: '🏠',
  Bureau: '🏗', Terrain: '🌇', Garage: '🚗',
  'Local commercial': '🏪', Ferme: '🌿',
};

export default function ListingCard({ listing, isFavorited = false, view = 'grid' }) {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const toggleFav = useToggleFavorite();
  const [faved, setFaved] = useState(isFavorited);

  const coverUrl = listing.cover_url || listing.images?.[0]?.url;
  const emoji = EMOJI_MAP[listing.property_type] || '🏠';

  function handleFav(e) {
    e.preventDefault();
    if (!token) return;
    setFaved(v => !v);
    toggleFav.mutate(listing.id, {
      onSuccess: (data) => {
        if (data.favorited) navigate('/favoris');
      },
    });
  }

  return (
    <Link
      to={`/annonce/${listing.slug}`}
      className={[styles.card, styles[view]].join(' ')}
    >
      {/* Image */}
      <div className={styles.imgWrap}>
        {coverUrl ? (
          <img src={coverUrl} alt={listing.title} className={styles.img} loading="lazy" />
        ) : (
          <div className={styles.placeholder}>{emoji}</div>
        )}
        <span className={[styles.badge, listing.transaction === 'Location' ? styles.rent : ''].join(' ')}>
          {listing.transaction}
        </span>
        {listing.is_new && <span className={styles.badgeNew}>Neuf</span>}
        {token && (
          <button className={[styles.fav, faved ? styles.faved : ''].join(' ')} onClick={handleFav} aria-label="Favori">
            <Heart size={15} fill={faved ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      {/* Infos */}
      <div className={styles.body}>
        <div className={styles.price}>{formatPrice(listing.price, listing.transaction)}</div>
        <h3 className={styles.title}>{listing.title}</h3>
        <p className={styles.loc}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {listing.city}{listing.address ? `, ${listing.address}` : ''}
        </p>

        <div className={styles.features}>
          {listing.surface   && <span><Maximize2 size={12}/>{listing.surface} m²</span>}
          {listing.rooms     && <span><BedDouble size={12}/>{listing.rooms} p.</span>}
          {listing.bathrooms && <span><Bath size={12}/>{listing.bathrooms} sdb</span>}
          {listing.has_parking && <span><Car size={12}/>Parking</span>}
        </div>

        <div className={styles.footer}>
          <span className={styles.date}>{formatRelativeDate(listing.created_at)}</span>
          {listing.first_name && (
            <span className={styles.agent}>{listing.first_name} {listing.last_name}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
