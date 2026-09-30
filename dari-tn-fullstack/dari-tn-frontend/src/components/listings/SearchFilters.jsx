import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { GOVERNORATES, TUNISIAN_CITIES } from '@/utils/format';
import styles from './SearchFilters.module.css';

const TYPES = ['Appartement','Villa','Maison','Bureau','Terrain','Garage','Local commercial','Ferme'];

export default function SearchFilters() {
  const [sp, setSp] = useSearchParams();
  const [showMore, setShowMore] = useState(false);

  function get(key) { return sp.get(key) || ''; }

  function set(key, value) {
    const next = new URLSearchParams(sp);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSp(next);
  }

  function toggleBool(key) {
    const cur = sp.get(key);
    set(key, cur === 'true' ? '' : 'true');
  }

  function clearAll() {
    setSp(new URLSearchParams());
  }

  const hasFilters = [...sp.keys()].some(k => k !== 'q' && k !== 'page');

  return (
    <div className={styles.wrap}>
      {/* Row 1 : filtres principaux */}
      <div className={styles.row}>
        <select value={get('transaction')} onChange={e => set('transaction', e.target.value)} className={styles.select}>
          <option value="">Vente & Location</option>
          <option value="Vente">Vente</option>
          <option value="Location">Location</option>
        </select>

        <select value={get('property_type')} onChange={e => set('property_type', e.target.value)} className={styles.select}>
          <option value="">Tout type</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={get('governorate')} onChange={e => set('governorate', e.target.value)} className={styles.select}>
          <option value="">Tous gouvernorats</option>
          {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        <select value={get('city')} onChange={e => set('city', e.target.value)} className={styles.select}>
          <option value="">Toutes les villes</option>
          {TUNISIAN_CITIES.map(city => <option key={city.name} value={city.name}>{city.name}</option>)}
        </select>

        <div className={styles.priceRange}>
          <input
            type="number" placeholder="Prix min (DT)"
            value={get('min_price')} onChange={e => set('min_price', e.target.value)}
            className={styles.input} min={0}
          />
          <span>—</span>
          <input
            type="number" placeholder="Prix max (DT)"
            value={get('max_price')} onChange={e => set('max_price', e.target.value)}
            className={styles.input} min={0}
          />
        </div>

        <button className={styles.moreBtn} onClick={() => setShowMore(v => !v)}>
          <SlidersHorizontal size={14} />
          {showMore ? 'Moins' : 'Plus de filtres'}
        </button>

        {hasFilters && (
          <button className={styles.clearBtn} onClick={clearAll}>
            <X size={13} /> Effacer
          </button>
        )}
      </div>

      {/* Row 2 : filtres avancés */}
      {showMore && (
        <div className={styles.row2}>
          <div className={styles.priceRange}>
            <input
              type="number" placeholder="Surface min (m²)"
              value={get('min_surface')} onChange={e => set('min_surface', e.target.value)}
              className={styles.input} min={0}
            />
            <span>—</span>
            <input
              type="number" placeholder="Surface max (m²)"
              value={get('max_surface')} onChange={e => set('max_surface', e.target.value)}
              className={styles.input} min={0}
            />
          </div>

          <select value={get('rooms')} onChange={e => set('rooms', e.target.value)} className={styles.select}>
            <option value="">Nbre de pièces</option>
            <option value="1">Studio / 1 p.</option>
            <option value="2">2 pièces+</option>
            <option value="3">3 pièces+</option>
            <option value="4">4 pièces+</option>
            <option value="5">5 pièces+</option>
          </select>

          <div className={styles.checks}>
            <label className={styles.check}>
              <input type="checkbox" checked={get('is_new') === 'true'} onChange={() => toggleBool('is_new')} />
              Neuf
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={get('is_furnished') === 'true'} onChange={() => toggleBool('is_furnished')} />
              Meublé
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={get('has_parking') === 'true'} onChange={() => toggleBool('has_parking')} />
              Parking
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={get('has_pool') === 'true'} onChange={() => toggleBool('has_pool')} />
              Piscine
            </label>
          </div>

          <select value={get('sort')} onChange={e => set('sort', e.target.value)} className={styles.select}>
            <option value="">Trier par : Date</option>
            <option value="price">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="surface">Surface</option>
            <option value="views_count">Popularité</option>
          </select>
        </div>
      )}
    </div>
  );
}
