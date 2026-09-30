import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, List, Map as MapIcon, LayoutGrid } from 'lucide-react';
import { useListings } from '@/hooks/useListings';
import { listingsApi } from '@/api/listings.api';
import ListingCard from '@/components/listings/ListingCard';
import SearchFilters from '@/components/listings/SearchFilters';
import MapView from '@/components/map/MapView';
import Spinner from '@/components/common/Spinner';
import styles from './SearchPage.module.css';

const PAGE_SIZE = 12;

export default function SearchPage() {
  const [sp, setSp] = useSearchParams();
  const [view, setView]       = useState('split');   // 'grid' | 'list' | 'split'
  const [activeId, setActiveId] = useState(null);
  const [searchInput, setSearch] = useState(sp.get('q') || '');
  const [isNaturalSearching, setIsNaturalSearching] = useState(false);

  const page = parseInt(sp.get('page') || '1');

  // Construire les paramètres API depuis les searchParams
  const apiParams = {
    page,
    limit: PAGE_SIZE,
    transaction:   sp.get('transaction')   || undefined,
    property_type: sp.get('property_type') || undefined,
    city:          sp.get('city')          || undefined,
    governorate:   sp.get('governorate')   || undefined,
    min_price:     sp.get('min_price')     || undefined,
    max_price:     sp.get('max_price')     || undefined,
    min_surface:   sp.get('min_surface')   || undefined,
    max_surface:   sp.get('max_surface')   || undefined,
    rooms:         sp.get('rooms')         || undefined,
    is_new:        sp.get('is_new')        || undefined,
    is_furnished:  sp.get('is_furnished')  || undefined,
    has_parking:   sp.get('has_parking')   || undefined,
    has_pool:      sp.get('has_pool')      || undefined,
    sort:          sp.get('sort')          || undefined,
    order:         sp.get('order')         || undefined,
  };

  // Filtrer les undefined
  Object.keys(apiParams).forEach(k => apiParams[k] === undefined && delete apiParams[k]);

  const { data, isLoading, isFetching } = useListings(apiParams);
  const listings = data?.listings || [];
  const pagination = data?.pagination;

  async function handleSearch(e) {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;

    setIsNaturalSearching(true);
    try {
      const { filters = {} } = await listingsApi.naturalSearch(query);
      const next = new URLSearchParams(sp);
      ['transaction', 'property_type', 'city', 'governorate', 'min_price', 'max_price', 'min_surface', 'max_surface', 'rooms', 'is_new', 'is_furnished', 'has_parking', 'has_pool']
        .forEach((key) => next.delete(key));
      Object.entries(filters).forEach(([key, value]) => next.set(key, String(value)));
      next.set('q', query);
      next.delete('page');
      setSp(next);
    } catch (error) {
      const next = new URLSearchParams(sp);
      next.set('q', query);
      next.delete('page');
      setSp(next);
    } finally {
      setIsNaturalSearching(false);
    }
  }

  function setPage(p) {
    const next = new URLSearchParams(sp);
    next.set('page', p);
    setSp(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const showMap = view === 'split' || view === 'map';
  const showList = view === 'split' || view === 'grid' || view === 'list';

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <form className={styles.searchBar} onSubmit={handleSearch}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Ville, quartier, type de bien..."
            value={searchInput}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchBtn} disabled={isNaturalSearching}>
            {isNaturalSearching ? 'Analyse...' : 'Rechercher'}
          </button>
        </form>

        <div className={styles.viewToggle}>
          <button
            className={[styles.viewBtn, view === 'grid' ? styles.active : ''].join(' ')}
            onClick={() => setView('grid')} title="Liste"
          ><LayoutGrid size={16} /></button>
          <button
            className={[styles.viewBtn, view === 'split' ? styles.active : ''].join(' ')}
            onClick={() => setView('split')} title="Vue partagée"
          ><List size={16} /></button>
          <button
            className={[styles.viewBtn, view === 'map' ? styles.active : ''].join(' ')}
            onClick={() => setView('map')} title="Carte"
          ><MapIcon size={16} /></button>
        </div>
      </div>

      {/* Filtres */}
      <SearchFilters />

      {/* Main */}
      <div className={[styles.main, styles[view]].join(' ')}>
        {/* Liste */}
        {showList && (
          <div className={styles.listPanel}>
            <div className={styles.resultHeader}>
              <span className={styles.count}>
                {isLoading ? '...' : `${pagination?.total ?? 0} annonce(s)`}
              </span>
              {isFetching && !isLoading && <Spinner size={14} />}
            </div>

            {isLoading ? (
              <div className={styles.loading}><Spinner size={36} /></div>
            ) : listings.length === 0 ? (
              <div className={styles.empty}>
                <span>🔍</span>
                <h3>Aucune annonce trouvée</h3>
                <p>Essayez de modifier vos filtres ou d'élargir votre recherche.</p>
              </div>
            ) : (
              <div className={view === 'list' ? styles.listGrid : styles.cardGrid}>
                {listings.map((l, i) => (
                  <div
                    key={l.id}
                    className={`animate-fade-up stagger-${Math.min(i % 6 + 1, 5)}`}
                    onMouseEnter={() => setActiveId(l.id)}
                    onMouseLeave={() => setActiveId(null)}
                  >
                    <ListingCard listing={l} view={view === 'list' ? 'list' : 'grid'} />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >← Précédent</button>
                <div className={styles.pageNums}>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === pagination.pages || Math.abs(p - page) <= 2)
                    .reduce((acc, p, i, arr) => {
                      if (i > 0 && arr[i-1] !== p - 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) => p === '...'
                      ? <span key={i} className={styles.pageDots}>…</span>
                      : <button
                          key={p}
                          className={[styles.pageNum, p === page ? styles.pageActive : ''].join(' ')}
                          onClick={() => setPage(p)}
                        >{p}</button>
                    )
                  }
                </div>
                <button
                  className={styles.pageBtn}
                  disabled={page >= pagination.pages}
                  onClick={() => setPage(page + 1)}
                >Suivant →</button>
              </div>
            )}
          </div>
        )}

        {/* Carte */}
        {showMap && (
          <div className={styles.mapPanel}>
            <MapView
              listings={listings}
              activeId={activeId}
              onSelect={setActiveId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
