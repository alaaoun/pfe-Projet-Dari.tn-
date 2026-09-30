import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useAdminListings, useUpdateListingStatus, useDeleteListing } from '@/hooks/useListings';
import { useAdminAppointments, useUpdateAppointmentStatus, useCancelAppointment } from '@/hooks/useAppointments';
import { formatDate, formatPrice } from '@/utils/format';
import styles from './AdminPage.module.css';

const TABS = [
  { id: 'listings', label: 'Annonces' },
  { id: 'appointments', label: 'Rendez-vous' },
];

const LISTING_STATUSES = ['pending', 'active', 'sold', 'rented', 'archived'];

export default function AdminPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('listings');
  const [listingStatus, setListingStatus] = useState('pending');

  const { data: listingsData = {}, isLoading: listingsLoading } = useAdminListings(listingStatus);
  const listings = listingsData.listings || [];
  const { data: appointments = [], isLoading: appointmentsLoading } = useAdminAppointments();

  const listingStats = useMemo(() => {
    return listings.reduce((stats, listing) => {
      stats.total += 1;
      stats[listing.status] = (stats[listing.status] || 0) + 1;
      return stats;
    }, { total: 0 });
  }, [listings]);

  const appointmentStats = useMemo(() => {
    return appointments.reduce((stats, appointment) => {
      stats.total += 1;
      stats[appointment.status] = (stats[appointment.status] || 0) + 1;
      return stats;
    }, { total: 0 });
  }, [appointments]);

  const updateListingStatus = useUpdateListingStatus();
  const deleteListing = useDeleteListing();
  const updateAppointmentStatus = useUpdateAppointmentStatus();
  const cancelAppointment = useCancelAppointment();

  function approveListing(id) {
    updateListingStatus.mutate({ id, status: 'active' });
  }

  function archiveListing(id) {
    updateListingStatus.mutate({ id, status: 'archived' });
  }

  function removeListing(id) {
    if (!window.confirm('Supprimer cette annonce ?')) return;
    deleteListing.mutate(id);
  }

  function confirmAppointment(id) {
    updateAppointmentStatus.mutate({ id, data: { status: 'confirmed' } });
  }

  function cancelAppointmentAction(id) {
    if (!window.confirm('Annuler ce rendez-vous ?')) return;
    cancelAppointment.mutate(id);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.tag}>Espace administrateur</p>
          <h1>Bienvenue, {user?.first_name || 'Admin'}</h1>
          <p className={styles.description}>
            Contrôlez les annonces et rendez-vous des clients depuis cet espace.
          </p>
        </div>
      </header>

      <div className={styles.actionBar}>
        <div>
          <p className={styles.smallLabel}>Tableau de bord administrateur</p>
          <h2 className={styles.subTitle}>Vue d’ensemble</h2>
        </div>
        <Link to="/admin/users" className={styles.linkButton}>
          Gérer les utilisateurs
        </Link>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Annonces affichées</span>
          <span className={styles.statValue}>{listingStats.total}</span>
          <span className={styles.statMeta}>{listingStats.pending || 0} en attente • {listingStats.active || 0} actives</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Rendez-vous</span>
          <span className={styles.statValue}>{appointmentStats.total}</span>
          <span className={styles.statMeta}>{appointmentStats.pending || 0} en attente • {appointmentStats.confirmed || 0} confirmés</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Actions rapides</span>
          <span className={styles.statValue}>2 tableaux</span>
          <span className={styles.statMeta}>Liste des annonces & gestion des demandes</span>
        </div>
      </div>

      <div className={styles.actionBar}>
        <div className={styles.tabBar}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={[styles.tabButton, activeTab === tab.id ? styles.tabActive : ''].join(' ')}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'listings' && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Annonces</h2>
            <p>Approuvez ou supprimez les annonces publiées par les clients.</p>
          </div>
          <div className={styles.statusFilters}>
            {LISTING_STATUSES.map((status) => (
              <button
                key={status}
                className={[styles.filterButton, listingStatus === status ? styles.filterActive : ''].join(' ')}
                onClick={() => setListingStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>

          {listingsLoading ? (
            <div className={styles.empty}>Chargement...</div>
          ) : listings.length === 0 ? (
            <div className={styles.empty}>
              <h3>Aucune annonce en attente</h3>
              <p>Les nouvelles annonces publiées par les clients apparaîtront ici.</p>
            </div>
          ) : (
            <div className={styles.table}>
              {listings.map((listing) => (
                <div key={listing.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <div className={styles.rowHeader}>
                      <strong>{listing.title}</strong>
                      <span className={[styles.badge, styles[`status-${listing.status}`]].join(' ')}>{listing.status}</span>
                    </div>
                    <div className={styles.rowMeta}>
                      <span>{listing.city} • {listing.property_type}</span>
                      <span>{formatPrice(listing.price, listing.transaction)}</span>
                      <span>Publié par : {listing.owner?.first_name} {listing.owner?.last_name}</span>
                    </div>
                  </div>
                  <div className={styles.rowActions}>
                    {listing.status === 'pending' && (
                      <>
                        <button className={styles.approveButton} onClick={() => approveListing(listing.id)} disabled={updateListingStatus.isLoading}>
                          Approuver
                        </button>
                        <button className={styles.deleteButton} onClick={() => archiveListing(listing.id)} disabled={updateListingStatus.isLoading}>
                          Archiver
                        </button>
                      </>
                    )}
                    {listing.status === 'active' && (
                      <button className={styles.deleteButton} onClick={() => archiveListing(listing.id)} disabled={updateListingStatus.isLoading}>
                        Archiver
                      </button>
                    )}
                    {listing.status === 'archived' && (
                      <button className={styles.approveButton} onClick={() => approveListing(listing.id)} disabled={updateListingStatus.isLoading}>
                        Réactiver
                      </button>
                    )}
                    <button className={styles.deleteButton} onClick={() => removeListing(listing.id)} disabled={deleteListing.isLoading}>
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'appointments' && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Rendez-vous</h2>
            <p>Confirmez ou annulez les demandes de visite des clients.</p>
          </div>

          {appointmentsLoading ? (
            <div className={styles.empty}>Chargement...</div>
          ) : appointments.length === 0 ? (
            <div className={styles.empty}>
              <h3>Aucun rendez-vous trouvé</h3>
              <p>Les rendez-vous demandés apparaîtront ici pour être gérés.</p>
            </div>
          ) : (
            <div className={styles.table}>
              {appointments.map((appointment) => (
                <div key={appointment.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <div className={styles.rowHeader}>
                      <strong>{appointment.listing?.title || 'Annonce'}</strong>
                      <span className={[styles.badge, styles[`status-${appointment.status}`]].join(' ')}>{appointment.status}</span>
                    </div>
                    <div className={styles.rowMeta}>
                      <span>{formatDate(appointment.scheduled_at)} • {appointment.listing?.city}</span>
                      <span>Client : {appointment.requester?.first_name} {appointment.requester?.last_name}</span>
                    </div>
                  </div>
                  <div className={styles.rowActions}>
                    {appointment.status === 'pending' && (
                      <button className={styles.approveButton} onClick={() => confirmAppointment(appointment.id)} disabled={updateAppointmentStatus.isLoading}>
                        Confirmer
                      </button>
                    )}
                    <button className={styles.deleteButton} onClick={() => cancelAppointmentAction(appointment.id)} disabled={cancelAppointment.isLoading}>
                      Annuler
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
