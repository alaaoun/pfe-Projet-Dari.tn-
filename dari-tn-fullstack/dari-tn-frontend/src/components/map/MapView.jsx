import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BedDouble, Bath, MapPin, Maximize2 } from 'lucide-react';
import { formatPrice } from '@/utils/format';
import styles from './MapView.module.css';

const markerIcon = L.divIcon({
  className: 'dari-map-marker',
  html: '<span></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const activeMarkerIcon = L.divIcon({
  className: 'dari-map-marker dari-map-marker-active',
  html: '<span></span>',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

function FitBounds({ listings }) {
  const map = useMap();

  useEffect(() => {
    if (!listings.length) return;
    const bounds = L.latLngBounds(listings.map((l) => [l.latitude, l.longitude]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [listings, map]);

  return null;
}

export default function MapView({ listings = [], activeId, onSelect }) {
  const points = useMemo(
    () => listings.filter((l) => l.latitude != null && l.longitude != null),
    [listings],
  );

  if (!points.length) {
    return (
      <div className={styles.empty}>
        <span>Aucune localisation disponible</span>
      </div>
    );
  }

  const center = [points[0].latitude, points[0].longitude];

  return (
    <div className={styles.map}>
      <MapContainer center={center} zoom={11} scrollWheelZoom className={styles.container}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.length > 1 && <FitBounds listings={points} />}
        {points.map((listing) => {
          const coverUrl = listing.cover_url || listing.images?.[0]?.url || null;

          return (
            <Marker
              key={listing.id}
              position={[listing.latitude, listing.longitude]}
              icon={listing.id === activeId ? activeMarkerIcon : markerIcon}
              eventHandlers={{
                click: () => onSelect?.(listing.id),
              }}
            >
              <Popup>
                <div className={styles.popup}>
                  <div className={styles.popupImageWrap}>
                    {coverUrl ? (
                      <img src={coverUrl} alt={listing.title} className={styles.popupImage} />
                    ) : (
                      <div className={styles.popupPlaceholder}>🏠</div>
                    )}
                  </div>

                  <div className={styles.popupBody}>
                    <span className={styles.transactionBadge}>{listing.transaction}</span>
                    <h4 className={styles.popupTitle}>{listing.title}</h4>
                    <div className={styles.priceRow}>{formatPrice(listing.price, listing.transaction)}</div>

                    <div className={styles.locationRow}>
                      <MapPin size={12} />
                      <span>{listing.city}{listing.governorate ? `, ${listing.governorate}` : ''}</span>
                    </div>

                    <div className={styles.metaRow}>
                      {listing.surface && (
                        <span><Maximize2 size={12} /> {listing.surface} m²</span>
                      )}
                      {listing.rooms && (
                        <span><BedDouble size={12} /> {listing.rooms} p.</span>
                      )}
                      {listing.bathrooms && (
                        <span><Bath size={12} /> {listing.bathrooms} sdb</span>
                      )}
                    </div>

                    <Link to={`/annonce/${listing.slug}`} className={styles.viewLink}>
                      Voir le bien
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
