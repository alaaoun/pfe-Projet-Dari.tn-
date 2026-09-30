import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateListing } from '@/hooks/useListings';
import { uploadApi } from '@/api/listings.api';
import ListingForm from '@/components/listings/ListingForm';
import toast from 'react-hot-toast';
import styles from './ListingFormPage.module.css';

export default function NewListingPage() {
  const navigate = useNavigate();
  const createListing = useCreateListing();
  const [createdId, setCreatedId] = useState(null);
  const [createdSlug, setCreatedSlug] = useState(null);

  async function handleSubmit(data) {
    // Nettoyer les champs vides
    Object.keys(data).forEach(k => {
      if (data[k] === '' || data[k] === undefined) delete data[k];
    });

    try {
      const listing = await createListing.mutateAsync(data);
      setCreatedId(listing.id);
      setCreatedSlug(listing.slug);
      toast.success('Annonce créée ! Vous pouvez maintenant ajouter des photos.');
    } catch (_) {}
  }

  function goToListing() {
    if (createdSlug) navigate(`/annonce/${createdSlug}`);
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <h1 className={styles.title}>Publier une annonce</h1>
          <p className={styles.sub}>Touchez des milliers d'acheteurs et locataires en Tunisie</p>
        </div>

        {createdId ? (
          <div className={styles.successBanner}>
            <div className={styles.successIcon}>✅</div>
            <h2>Annonce publiée avec succès !</h2>
            <p>Vous pouvez maintenant ajouter des photos à votre annonce.</p>
            <div className={styles.successActions}>
              <button className={styles.primaryBtn} onClick={goToListing}>
                Voir mon annonce →
              </button>
              <button className={styles.secondaryBtn} onClick={() => { setCreatedId(null); setCreatedSlug(null); }}>
                Publier une autre annonce
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.formCard}>
            <ListingForm
              onSubmit={handleSubmit}
              loading={createListing.isLoading}
              listingId={createdId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
