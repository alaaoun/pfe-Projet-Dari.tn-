import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useListing, useUpdateListing } from '@/hooks/useListings';
import ListingForm from '@/components/listings/ListingForm';
import Spinner from '@/components/common/Spinner';
import styles from './ListingFormPage.module.css';

export default function EditListingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useListing(slug);
  const updateListing = useUpdateListing();

  const listing = data?.listing;

  async function handleSubmit(formData) {
    Object.keys(formData).forEach(k => {
      if (formData[k] === '' || formData[k] === undefined) delete formData[k];
    });
    await updateListing.mutateAsync({ id: listing.id, data: formData });
    navigate(`/annonce/${slug}`);
  }

  if (isLoading) return <div className={styles.loading}><Spinner size={40} /></div>;
  if (!listing)  return <div className={styles.error}>Annonce introuvable.</div>;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <h1 className={styles.title}>Modifier l'annonce</h1>
          <p className={styles.sub}>
            <button onClick={() => navigate(-1)} className={styles.backLink}>
              ← Retour à l'annonce
            </button>
          </p>
        </div>
        <div className={styles.formCard}>
          <ListingForm
            defaultValues={listing}
            onSubmit={handleSubmit}
            loading={updateListing.isLoading}
            listingId={listing.id}
          />
        </div>
      </div>
    </div>
  );
}
