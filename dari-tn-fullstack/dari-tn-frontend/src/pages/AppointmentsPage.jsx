import React from 'react';
import { useMyAppointments } from '@/hooks/useAppointments';
import { formatDate } from '@/utils/format';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import styles from './AppointmentsPage.module.css';

export default function AppointmentsPage() {
  const { data: appointments = [], isLoading, error } = useMyAppointments();

  if (isLoading) return (
    <div className={styles.loading}><Spinner size={40} /></div>
  );

  if (error) return (
    <div className={styles.empty}>
      <h2>Impossible de charger les rendez-vous</h2>
      <p>Réessayez plus tard ou vérifiez votre connexion.</p>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Mes rendez-vous</h1>
          <p>Liste des visites demandées et des rendez-vous reçus.</p>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className={styles.empty}>
          <h2>Aucun rendez-vous pour le moment</h2>
          <p>Demandez une visite depuis une annonce pour les créer.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {appointments.map((appointment) => (
            <div key={appointment.id} className={styles.card}>
              <div className={styles.row}>
                <div>
                  <h3>{appointment.listing?.title || 'Annonce'}</h3>
                  <p>{appointment.listing?.city} — {formatDate(appointment.scheduled_at)}</p>
                </div>
                <span className={styles.status}>{appointment.status}</span>
              </div>
              <div className={styles.details}>
                <div>
                  <strong>Demandeur :</strong> {appointment.requester?.first_name} {appointment.requester?.last_name}
                </div>
                <div>
                  <strong>Agent :</strong> {appointment.agent?.first_name} {appointment.agent?.last_name}
                </div>
                {appointment.contact_phone && (
                  <div><strong>Téléphone :</strong> {appointment.contact_phone}</div>
                )}
                {appointment.note && (
                  <div><strong>Note :</strong> {appointment.note}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
