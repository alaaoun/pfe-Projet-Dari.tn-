import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, Home, Key, Trash2, Edit3, Eye, ToggleLeft } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useUpdateProfile, useChangePassword } from '@/hooks/useAuth';
import { useMyListings, useDeleteListing, useUpdateListing } from '@/hooks/useListings';
import { formatPrice, formatRelativeDate } from '@/utils/format';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import styles from './ProfilePage.module.css';

const TABS = [
  { id: 'listings', label: 'Mes annonces', icon: <Home size={15}/> },
  { id: 'profile',  label: 'Mon profil',   icon: <User size={15}/> },
  { id: 'security', label: 'Sécurité',     icon: <Key size={15}/> },
];

const STATUS_LABELS = {
  active:   { label: 'Active',  color: 'var(--olive-3)' },
  pending:  { label: 'En attente', color: 'var(--terra)' },
  sold:     { label: 'Vendu',   color: 'var(--ink-3)' },
  rented:   { label: 'Loué',    color: 'var(--ink-3)' },
  archived: { label: 'Archivée',color: 'var(--ink-4)' },
};

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('listings');

  const { data: listings = [], isLoading } = useMyListings();
  const updateProfile  = useUpdateProfile();
  const changePassword = useChangePassword();
  const deleteListing  = useDeleteListing();
  const updateListing  = useUpdateListing();

  const profileForm  = useForm({ defaultValues: { first_name: user?.first_name, last_name: user?.last_name, phone: user?.phone || '' } });
  const passwordForm = useForm();

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cette annonce ?')) return;
    deleteListing.mutate(id);
  }

  async function cycleStatus(listing) {
    const next = { active: 'archived', archived: 'active', sold: 'active', rented: 'active' };
    updateListing.mutate({ id: listing.id, data: { status: next[listing.status] || 'active' } });
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.avatarBlock}>
            <div className={styles.avatar}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div>
              <strong className={styles.userName}>{user?.first_name} {user?.last_name}</strong>
              <span className={styles.userRole}>
                {user?.role === 'admin' ? '🛡 Admin' : user?.role === 'agent' ? '🏠 Agent' : '👤 Particulier'}
              </span>
            </div>
          </div>

          <nav className={styles.tabList}>
            {TABS.map(t => (
              <button
                key={t.id}
                className={[styles.tabBtn, tab === t.id ? styles.tabActive : ''].join(' ')}
                onClick={() => setTab(t.id)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className={styles.main}>

          {/* ── MES ANNONCES ── */}
          {tab === 'listings' && (
            <div className={styles.section}>
              <div className={styles.sectionHead}>
                <h2>Mes annonces <span className={styles.badge}>{listings.length}</span></h2>
                <Link to="/publier" className={styles.addBtn}>+ Nouvelle annonce</Link>
              </div>

              {isLoading ? (
                <div className={styles.loading}><Spinner size={32} /></div>
              ) : listings.length === 0 ? (
                <div className={styles.empty}>
                  <Home size={48} />
                  <h3>Aucune annonce publiée</h3>
                  <p>Publiez votre première annonce gratuitement.</p>
                  <Link to="/publier" className={styles.addBtnLg}>Publier une annonce</Link>
                </div>
              ) : (
                <div className={styles.listingsList}>
                  {listings.map(l => (
                    <div key={l.id} className={styles.listingRow}>
                      <div className={styles.listingThumb}>
                        {l.images?.[0]?.url
                          ? <img src={l.images[0].url} alt={l.title} />
                          : <span>{l.property_type === 'Villa' ? '🏡' : '🏢'}</span>
                        }
                      </div>
                      <div className={styles.listingInfo}>
                        <div className={styles.listingTitle}>{l.title}</div>
                        <div className={styles.listingMeta}>
                          <span className={styles.listingPrice}>{formatPrice(l.price, l.transaction)}</span>
                          <span>·</span>
                          <span>{l.city}</span>
                          <span>·</span>
                          <span>{formatRelativeDate(l.created_at)}</span>
                          <span>·</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Eye size={12}/> {l.views_count} vues
                          </span>
                        </div>
                      </div>
                      <div className={styles.listingStatus}>
                        <button
                          className={styles.statusChip}
                          style={{ background: STATUS_LABELS[l.status]?.color + '18', color: STATUS_LABELS[l.status]?.color, borderColor: STATUS_LABELS[l.status]?.color + '44' }}
                          onClick={() => cycleStatus(l)}
                          title="Cliquer pour changer le statut"
                        >
                          {STATUS_LABELS[l.status]?.label}
                        </button>
                      </div>
                      <div className={styles.listingActions}>
                        <Link to={`/annonce/${l.slug}`} className={styles.iconAction} title="Voir">
                          <Eye size={15}/>
                        </Link>
                        <Link to={`/annonce/${l.slug}/modifier`} className={styles.iconAction} title="Modifier">
                          <Edit3 size={15}/>
                        </Link>
                        <button className={[styles.iconAction, styles.deleteAction].join(' ')} title="Supprimer" onClick={() => handleDelete(l.id)}>
                          <Trash2 size={15}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PROFIL ── */}
          {tab === 'profile' && (
            <div className={styles.section}>
              <div className={styles.sectionHead}><h2>Mon profil</h2></div>
              <form
                className={styles.form}
                onSubmit={profileForm.handleSubmit(d => updateProfile.mutate(d))}
              >
                <div className={styles.formRow}>
                  <div className={styles.field}>
                    <label>Prénom</label>
                    <input {...profileForm.register('first_name')} className={styles.input} />
                  </div>
                  <div className={styles.field}>
                    <label>Nom</label>
                    <input {...profileForm.register('last_name')} className={styles.input} />
                  </div>
                </div>
                <div className={styles.field}>
                  <label>Email</label>
                  <input value={user?.email || ''} className={styles.input} disabled style={{ opacity: 0.6 }} />
                  <small style={{ fontSize: 11, color: 'var(--ink-4)' }}>L'email ne peut pas être modifié.</small>
                </div>
                <div className={styles.field}>
                  <label>Téléphone</label>
                  <input {...profileForm.register('phone')} className={styles.input} placeholder="+216 XX XXX XXX" />
                </div>
                <Button type="submit" variant="primary" loading={updateProfile.isLoading}>
                  Sauvegarder les modifications
                </Button>
              </form>
            </div>
          )}

          {/* ── SÉCURITÉ ── */}
          {tab === 'security' && (
            <div className={styles.section}>
              <div className={styles.sectionHead}><h2>Sécurité</h2></div>
              <div className={styles.secCard}>
                <h3>Changer le mot de passe</h3>
                <p>Après modification, vous serez déconnecté(e) de tous vos appareils.</p>
                <form
                  className={styles.form}
                  onSubmit={passwordForm.handleSubmit(d => changePassword.mutate(d))}
                >
                  <div className={styles.field}>
                    <label>Mot de passe actuel</label>
                    <input
                      type="password"
                      {...passwordForm.register('currentPassword', { required: true })}
                      className={styles.input}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Nouveau mot de passe</label>
                    <input
                      type="password"
                      {...passwordForm.register('newPassword', { required: true, minLength: 8 })}
                      className={styles.input}
                      placeholder="Minimum 8 caractères"
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      {...passwordForm.register('confirm', {
                        validate: v => v === passwordForm.watch('newPassword') || 'Les mots de passe ne correspondent pas'
                      })}
                      className={styles.input}
                      placeholder="••••••••"
                    />
                    {passwordForm.formState.errors.confirm && (
                      <span style={{ fontSize: 12, color: 'var(--terra)' }}>
                        {passwordForm.formState.errors.confirm.message}
                      </span>
                    )}
                  </div>
                  <Button type="submit" variant="secondary" loading={changePassword.isLoading}>
                    <Key size={14}/> Modifier le mot de passe
                  </Button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
