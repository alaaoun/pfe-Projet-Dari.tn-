import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, TrendingUp, Shield, Clock } from 'lucide-react';
import { useListings } from '@/hooks/useListings';
import ListingCard from '@/components/listings/ListingCard';
import Spinner from '@/components/common/Spinner';
import styles from './HomePage.module.css';

const CITIES = ['Tunis','Sfax','Sousse','Monastir','Hammamet','Nabeul','La Marsa','Sidi Bou Saïd'];
const TYPES  = [
  { label: 'Appartements', icon: '🏢', value: 'Appartement' },
  { label: 'Villas',       icon: '🏡', value: 'Villa' },
  { label: 'Maisons',      icon: '🏠', value: 'Maison' },
  { label: 'Bureaux',      icon: '🏗', value: 'Bureau' },
  { label: 'Terrains',     icon: '🌇', value: 'Terrain' },
  { label: 'Garages',      icon: '🚗', value: 'Garage' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery]       = useState('');
  const [transaction, setTrans] = useState('');
  const inputRef = useRef(null);

  const { data: featured, isLoading } = useListings({ limit: 6, sort: 'views_count', order: 'DESC' });
  const { data: newest }              = useListings({ limit: 6, sort: 'created_at', order: 'DESC' });

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query)       params.set('q', query);
    if (transaction) params.set('transaction', transaction);
    navigate(`/recherche?${params}`);
  }

  function goToType(type) {
    navigate(`/recherche?property_type=${encodeURIComponent(type)}`);
  }
  function goToCity(city) {
    navigate(`/recherche?city=${encodeURIComponent(city)}`);
  }

  return (
    <div className={styles.page}>
      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.heroEyebrow}>🇹🇳 La référence immobilière en Tunisie</p>
          <h1 className={styles.heroTitle}>
            Trouvez votre<br />
            <em>bien idéal</em>
          </h1>
          <p className={styles.heroSub}>
            Des milliers d'annonces vérifiées — appartements, villas, bureaux, terrains
          </p>

          {/* Search box */}
          <form className={styles.searchBox} onSubmit={handleSearch}>
            <select
              value={transaction}
              onChange={e => setTrans(e.target.value)}
              className={styles.searchSelect}
            >
              <option value="">Vente & Location</option>
              <option value="Vente">Acheter</option>
              <option value="Location">Louer</option>
            </select>
            <div className={styles.searchDivider} />
            <div className={styles.searchInputWrap}>
              <MapPin size={16} className={styles.searchIcon} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Ville, quartier, type de bien..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <button type="submit" className={styles.searchBtn}>
              <Search size={18} />
              Rechercher
            </button>
          </form>

          {/* Quick cities */}
          <div className={styles.quickCities}>
            {CITIES.map(c => (
              <button key={c} className={styles.cityChip} onClick={() => goToCity(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Déco */}
        <div className={styles.heroBg} aria-hidden />
      </section>

      {/* ── STATS ── */}
      <section className={styles.stats}>
        <div className={styles.statsInner}>
          {[
            { val: '2 400+', lab: 'Annonces actives' },
            { val: '24',     lab: 'Gouvernorats couverts' },
            { val: '98%',    lab: 'Annonces vérifiées' },
            { val: '4 800+', lab: 'Utilisateurs inscrits' },
          ].map(s => (
            <div key={s.lab} className={styles.stat}>
              <strong>{s.val}</strong>
              <span>{s.lab}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── TYPES ── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <h2>Explorer par type</h2>
            <p>Trouvez le bien qui correspond à votre projet</p>
          </div>
          <div className={styles.typeGrid}>
            {TYPES.map(t => (
              <button key={t.value} className={styles.typeCard} onClick={() => goToType(t.value)}>
                <span className={styles.typeEmoji}>{t.icon}</span>
                <span className={styles.typeLabel}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED ── */}
      <section className={[styles.section, styles.sectionAlt].join(' ')}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <h2>Annonces populaires</h2>
            <a href="/recherche?sort=views_count&order=DESC" className={styles.seeAll}>Voir tout →</a>
          </div>
          {isLoading ? (
            <div className={styles.loading}><Spinner size={32} /></div>
          ) : (
            <div className={styles.listingsGrid}>
              {featured?.listings?.map((l, i) => (
                <div key={l.id} className={`stagger-${Math.min(i + 1, 5)}`}>
                  <ListingCard listing={l} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── NEWEST ── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <h2>Dernières annonces</h2>
            <a href="/recherche" className={styles.seeAll}>Voir tout →</a>
          </div>
          <div className={styles.listingsGrid}>
            {newest?.listings?.map((l, i) => (
              <div key={l.id} className={`stagger-${Math.min(i + 1, 5)}`}>
                <ListingCard listing={l} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY ── */}
      <section className={[styles.section, styles.sectionDark].join(' ')}>
        <div className={styles.container}>
          <div className={styles.sectionHead} style={{ color: 'white' }}>
            <h2 style={{ color: 'white' }}>Pourquoi choisir Dari.tn ?</h2>
          </div>
          <div className={styles.whyGrid}>
            {[
              { icon: <Shield size={28} />, title: 'Annonces vérifiées', desc: 'Chaque annonce est contrôlée avant publication pour garantir authenticité et fiabilité.' },
              { icon: <Clock size={28} />, title: 'Mise à jour en temps réel', desc: 'Notre base est actualisée en permanence avec les dernières disponibilités du marché.' },
              { icon: <TrendingUp size={28} />, title: 'Meilleurs prix du marché', desc: 'Comparez facilement les prix et trouvez les meilleures opportunités immobilières.' },
              { icon: <MapPin size={28} />, title: 'Couverture nationale', desc: 'Toute la Tunisie couverte : des 24 gouvernorats aux quartiers les plus prisés.' },
            ].map(w => (
              <div key={w.title} className={styles.whyCard}>
                <div className={styles.whyIcon}>{w.icon}</div>
                <h3>{w.title}</h3>
                <p>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2>Vous avez un bien à vendre ou à louer ?</h2>
          <p>Publiez votre annonce gratuitement et touchez des milliers d'acheteurs et locataires.</p>
          <a href="/publier" className={styles.ctaBtn}>Publier mon annonce gratuitement</a>
        </div>
      </section>
    </div>
  );
}
