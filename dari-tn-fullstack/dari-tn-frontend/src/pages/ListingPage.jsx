import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Share2, MapPin, BedDouble, Bath, Maximize2, Car, Building2,
         Waves, Trees, Sun, Wind, Home, ArrowLeft, Eye, Calendar, Phone, Mail, Edit, Trash2 } from 'lucide-react';
import { useListing, useToggleFavorite, useSendMessage, useDeleteListing } from '@/hooks/useListings';
import { useCreateAppointment } from '@/hooks/useAppointments';
import ChatAssistant from '@/components/common/ChatAssistant';
import { useAuthStore } from '@/store/auth.store';
import { formatPrice, formatDate } from '@/utils/format';
import { useForm } from 'react-hook-form';
import MapView from '@/components/map/MapView';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import styles from './ListingPage.module.css';

const FEATURE_ICONS = {
  has_parking:  { icon: <Car size={16}/>,      label: 'Parking' },
  has_elevator: { icon: <Building2 size={16}/>, label: 'Ascenseur' },
  has_pool:     { icon: <Waves size={16}/>,    label: 'Piscine' },
  has_garden:   { icon: <Trees size={16}/>,    label: 'Jardin' },
  has_terrace:  { icon: <Sun size={16}/>,      label: 'Terrasse' },
  has_ac:       { icon: <Wind size={16}/>,     label: 'Climatisation' },
  has_heating:  { icon: <Home size={16}/>,     label: 'Chauffage' },
};

export default function ListingPage() {
  const { slug } = useParams();
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [coverIdx, setCoverIdx] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [favored, setFavored] = useState(false);

  const { data, isLoading, error } = useListing(slug);
  const listing = data?.listing;
  const isFavorited = data?.isFavorited || favored;

  const toggleFav = useToggleFavorite();
  const sendMsg   = useSendMessage();
  const deleteListing = useDeleteListing();
  const createAppointment = useCreateAppointment();
  const appointmentForm = useForm({
    defaultValues: {
      scheduled_at: '',
      contact_phone: user?.phone || '',
      note: `Bonjour, je souhaite visiter votre annonce "${listing?.title || ''}".`,
    },
  });
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (!listing) return;
    appointmentForm.reset({
      scheduled_at: '',
      contact_phone: user?.phone || '',
      note: `Bonjour, je souhaite visiter votre annonce "${listing.title}".`,
    });
  }, [listing, user?.phone]);

  if (isLoading) return (
    <div className={styles.loading}><Spinner size={40} /></div>
  );
  if (error || !listing) return (
    <div className={styles.notFound}>
      <h2>Annonce introuvable</h2>
      <Link to="/recherche">← Retour aux annonces</Link>
    </div>
  );

  const images = listing.images || [];
  const cover  = images[coverIdx];
  const isOwner = user?.id === listing.user_id || user?.role === 'admin';

  function handleFav() {
    if (!token) { navigate('/connexion'); return; }
    setFavored(v => !v);
    toggleFav.mutate(listing.id);
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: listing.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Supprimer cette annonce définitivement ?')) return;
    await deleteListing.mutateAsync(listing.id);
    navigate('/profil');
  }

  function onMessageSubmit(data) {
    sendMsg.mutate({ id: listing.id, data }, {
      onSuccess: () => { reset(); setShowContact(false); },
    });
  }

  function onAppointmentSubmit(data) {
    createAppointment.mutate(
      {
        listing_id: listing.id,
        scheduled_at: data.scheduled_at,
        contact_phone: data.contact_phone,
        note: data.note,
      },
      {
        onSuccess: () => {
          appointmentForm.reset({
            scheduled_at: '',
            contact_phone: user?.phone || '',
            note: `Bonjour, je souhaite visiter votre annonce "${listing.title}".`,
          });
        },
      }
    );
  }

  const features = Object.entries(FEATURE_ICONS)
    .filter(([key]) => listing[key])
    .map(([key, val]) => val);

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <div className={styles.breadInner}>
          <button onClick={() => navigate(-1)} className={styles.back}>
            <ArrowLeft size={15} /> Retour
          </button>
          <span className={styles.breadSep}>/</span>
          <Link to="/recherche">{listing.property_type}s</Link>
          <span className={styles.breadSep}>/</span>
          <span>{listing.city}</span>
          <span className={styles.breadSep}>/</span>
          <span className={styles.breadCurrent}>{listing.title}</span>
        </div>
        {isOwner && (
          <div className={styles.ownerActions}>
            <Link to={`/annonce/${slug}/modifier`} className={styles.editBtn}>
              <Edit size={14} /> Modifier
            </Link>
            <button className={styles.deleteBtn} onClick={handleDelete}>
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        )}
      </div>

      <div className={styles.inner}>
        {/* Galerie */}
        <div className={styles.gallery}>
          <div className={styles.mainImg}>
            {cover ? (
              <img src={cover.url} alt={listing.title} />
            ) : (
              <div className={styles.placeholder}>
                {listing.property_type === 'Villa' ? '🏡' : listing.property_type === 'Appartement' ? '🏢' : '🏠'}
              </div>
            )}
            <div className={styles.imgOverlay}>
              <span className={[styles.badge, listing.transaction === 'Location' ? styles.rent : ''].join(' ')}>
                {listing.transaction}
              </span>
              {listing.is_new && <span className={styles.badgeNew}>Neuf</span>}
            </div>
          </div>
          {images.length > 1 && (
            <div className={styles.thumbnails}>
              {images.map((img, i) => (
                <button
                  key={img.id}
                  className={[styles.thumb, i === coverIdx ? styles.thumbActive : ''].join(' ')}
                  onClick={() => setCoverIdx(i)}
                >
                  <img src={img.url} alt={`Photo ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className={styles.content}>
          {/* Header */}
          <div className={styles.header}>
            <div>
              <div className={styles.price}>{formatPrice(listing.price, listing.transaction)}</div>
              <h1 className={styles.title}>{listing.title}</h1>
              <div className={styles.loc}>
                <MapPin size={14} />
                {listing.city}{listing.governorate && ` — ${listing.governorate}`}
                {listing.address && `, ${listing.address}`}
              </div>
            </div>
            <div className={styles.headerActions}>
              <button className={[styles.actionBtn, isFavorited ? styles.favActive : ''].join(' ')} onClick={handleFav}>
                <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
              </button>
              <button className={styles.actionBtn} onClick={handleShare}>
                <Share2 size={18} />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.statsRow}>
            {listing.surface    && <div className={styles.stat}><Maximize2 size={16}/><strong>{listing.surface}</strong><span>m²</span></div>}
            {listing.rooms      && <div className={styles.stat}><BedDouble size={16}/><strong>{listing.rooms}</strong><span>pièces</span></div>}
            {listing.bedrooms   && <div className={styles.stat}><BedDouble size={16}/><strong>{listing.bedrooms}</strong><span>chambres</span></div>}
            {listing.bathrooms  && <div className={styles.stat}><Bath size={16}/><strong>{listing.bathrooms}</strong><span>sdb</span></div>}
            {listing.floor != null && <div className={styles.stat}><Home size={16}/><strong>{listing.floor}</strong><span>étage</span></div>}
          </div>

          {/* Meta */}
          <div className={styles.meta}>
            <span><Eye size={12}/> {listing.views_count} vues</span>
            <span><Calendar size={12}/> Publié {formatDate(listing.created_at)}</span>
            {listing.price_negotiable && <span className={styles.negotiable}>Prix négociable</span>}
          </div>

          {/* Description */}
          {listing.description && (
            <div className={styles.description}>
              <h2>Description</h2>
              <p>{listing.description}</p>
            </div>
          )}

          {/* Équipements */}
          {features.length > 0 && (
            <div className={styles.features}>
              <h2>Équipements</h2>
              <div className={styles.featGrid}>
                {features.map(f => (
                  <div key={f.label} className={styles.feat}>
                    {f.icon} {f.label}
                  </div>
                ))}
                {listing.is_furnished && <div className={styles.feat}><Home size={16}/> Meublé</div>}
              </div>
            </div>
          )}

          {/* Carte */}
          {(listing.latitude && listing.longitude) && (
            <div className={styles.mapSection}>
              <h2>Localisation</h2>
              <div className={styles.mapWrap}>
                <MapView listings={[listing]} />
              </div>
            </div>
          )}

          {/* Contact */}
          <div className={styles.contactCard}>
            <div className={styles.agentInfo}>
              <div className={styles.agentAvatar}>
                {listing.owner?.first_name?.[0]}{listing.owner?.last_name?.[0]}
              </div>
              <div>
                <strong>{listing.owner?.first_name} {listing.owner?.last_name}</strong>
                <span>{listing.owner?.role === 'agent' ? 'Agent immobilier' : 'Particulier'}</span>
              </div>
            </div>

            <div className={styles.contactBtns}>
              {listing.owner?.phone && (
                <a href={`tel:${listing.owner.phone}`} className={styles.phoneBtn}>
                  <Phone size={15} /> {listing.owner.phone}
                </a>
              )}
              <Button variant="terra" onClick={() => setShowContact(v => !v)}>
                <Mail size={15} /> Envoyer un message
              </Button>
            </div>

            {showContact && (
              <form className={styles.contactForm} onSubmit={handleSubmit(onMessageSubmit)}>
                <div className={styles.formRow}>
                  <input
                    {...register('sender_name', { required: true })}
                    placeholder="Votre nom *"
                    className={styles.formInput}
                  />
                  <input
                    {...register('sender_email', { required: true })}
                    type="email"
                    placeholder="Votre email *"
                    className={styles.formInput}
                  />
                </div>
                <input
                  {...register('sender_phone')}
                  placeholder="Votre téléphone (optionnel)"
                  className={styles.formInput}
                />
                <textarea
                  {...register('body', { required: true, minLength: 10 })}
                  placeholder="Votre message..."
                  rows={4}
                  className={styles.formTextarea}
                  defaultValue={`Bonjour, je suis intéressé(e) par votre annonce "${listing.title}". Pouvez-vous me contacter ?`}
                />
                <Button type="submit" variant="primary" loading={sendMsg.isLoading}>
                  Envoyer
                </Button>
              </form>
            )}

            {token && !isOwner && (
              <div className={styles.appointmentSection}>
                <h3>Demander une visite</h3>
                <form className={styles.contactForm} onSubmit={appointmentForm.handleSubmit(onAppointmentSubmit)}>
                  <label className={styles.fieldLabel}>Date et heure</label>
                  <input
                    {...appointmentForm.register('scheduled_at', { required: true })}
                    type="datetime-local"
                    className={styles.formInput}
                  />
                  <label className={styles.fieldLabel}>Téléphone de contact</label>
                  <input
                    {...appointmentForm.register('contact_phone')}
                    type="tel"
                    placeholder="Votre téléphone"
                    className={styles.formInput}
                  />
                  <label className={styles.fieldLabel}>Note</label>
                  <textarea
                    {...appointmentForm.register('note')}
                    placeholder="Message pour l'agent"
                    rows={3}
                    className={styles.formTextarea}
                  />
                  <Button type="submit" variant="secondary" loading={createAppointment.isLoading}>
                    Payer 20 TND et demander la visite
                  </Button>
                </form>
              </div>
            )}

            <ChatAssistant listing={listing} />
          </div>
        </div>
      </div>
    </div>
  );
}
