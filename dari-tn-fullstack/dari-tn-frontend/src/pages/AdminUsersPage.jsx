import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useAdminUsers, useUpdateUserStatus } from '@/hooks/useUsers';
import styles from './AdminPage.module.css';

const USER_ROLES = ['all', 'user', 'agent', 'admin'];

export default function AdminUsersPage() {
  const { user } = useAuthStore();
  const [roleFilter, setRoleFilter] = useState('all');

  const { data: usersData = {}, isLoading: usersLoading } = useAdminUsers(roleFilter);
  const users = usersData.users || [];

  const counts = useMemo(() => {
    return users.reduce((acc, account) => {
      acc.total += 1;
      acc[account.role] = (acc[account.role] || 0) + 1;
      if (account.is_active) acc.active += 1;
      else acc.inactive += 1;
      return acc;
    }, { total: 0, user: 0, agent: 0, admin: 0, active: 0, inactive: 0 });
  }, [users]);

  const updateUserStatus = useUpdateUserStatus();

  function toggleUserActive(userId, isActive) {
    updateUserStatus.mutate({ id: userId, data: { is_active: isActive } });
  }

  function changeUserRole(userId, role) {
    updateUserStatus.mutate({ id: userId, data: { role } });
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.tag}>Gestion des utilisateurs</p>
          <h1>Comptes et rôles</h1>
          <p className={styles.description}>
            Modifiez les rôles et l’état des comptes clients, agents et administrateurs.
          </p>
        </div>
        <Link to="/admin" className={styles.linkButton}>
          Retour tableau de bord
        </Link>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total</span>
          <span className={styles.statValue}>{counts.total}</span>
          <span className={styles.statMeta}>{counts.active} actifs · {counts.inactive} inactifs</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Agents</span>
          <span className={styles.statValue}>{counts.agent}</span>
          <span className={styles.statMeta}>Rôle agent</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Administrateurs</span>
          <span className={styles.statValue}>{counts.admin}</span>
          <span className={styles.statMeta}>Rôle admin</span>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.statusFilters}>
          {USER_ROLES.map((role) => (
            <button
              key={role}
              className={[styles.filterButton, roleFilter === role ? styles.filterActive : ''].join(' ')}
              onClick={() => setRoleFilter(role)}
            >
              {role === 'all' ? 'Tous' : role}
            </button>
          ))}
        </div>

        {usersLoading ? (
          <div className={styles.empty}>Chargement...</div>
        ) : users.length === 0 ? (
          <div className={styles.empty}>
            <h3>Aucun utilisateur trouvé</h3>
            <p>Les comptes disponibles seront listés ici.</p>
          </div>
        ) : (
          <div className={styles.table}>
            {users.map((account) => (
              <div key={account.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <div className={styles.rowHeader}>
                    <strong>{account.first_name} {account.last_name}</strong>
                    <span className={[styles.badge, account.is_active ? styles['status-active'] : styles['status-archived']].join(' ')}>
                      {account.is_active ? 'Actif' : 'Désactivé'}
                    </span>
                  </div>
                  <div className={styles.rowMeta}>
                    <span>{account.email}</span>
                    <span>Rôle : <strong>{account.role}</strong></span>
                    <span>Inscrit le : {new Date(account.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className={styles.rowActions}>
                  <select
                    className={styles.userRoleSelect}
                    value={account.role}
                    onChange={(e) => changeUserRole(account.id, e.target.value)}
                    disabled={updateUserStatus.isLoading || account.id === user?.id}
                  >
                    {USER_ROLES.filter((role) => role !== 'all').map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  <button
                    className={styles.approveButton}
                    onClick={() => toggleUserActive(account.id, !account.is_active)}
                    disabled={updateUserStatus.isLoading || account.id === user?.id}
                  >
                    {account.is_active ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
