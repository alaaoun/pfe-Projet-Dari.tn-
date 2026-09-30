import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, X, Star } from 'lucide-react';
import { GOVERNORATES, TUNISIAN_CITIES, getCityCoordinates } from '@/utils/format';
import { uploadApi } from '@/api/listings.api';
import Button from '@/components/common/Button';
import toast from 'react-hot-toast';
import styles from './ListingForm.module.css';

const TYPES = ['Appartement','Villa','Maison','Bureau','Terrain','Garage','Local commercial','Ferme'];

export default function ListingForm({ defaultValues = {}, onSubmit, loading = false, listingId }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({ defaultValues });
  const [images, setImages] = useState(defaultValues.images || []);
  const [uploading, setUploading] = useState(false);
  const propType = watch('property_type', defaultValues.property_type || 'Appartement');
  const isTerrain = propType === 'Terrain';

  const cityField = register('city', { required: 'Ville requise' });

  function handleCitySelect(value) {
    const coords = getCityCoordinates(value);
    if (coords) {
      setValue('latitude', String(coords.latitude), { shouldValidate: true });
      setValue('longitude', String(coords.longitude), { shouldValidate: true });
    } else {
      setValue('latitude', '', { shouldValidate: true });
      setValue('longitude', '', { shouldValidate: true });
    }
  }

  const handleFiles = useCallback(async (files) => {
    if (!listingId) {
      toast.error('Sauvegardez d\'abord l\'annonce pour ajouter des photos.');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadApi.uploadImages(listingId, Array.from(files));
      setImages(prev => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} photo(s) ajoutée(s) !`);
    } catch {
      toast.error('Erreur lors de l\'upload.');
    } finally {
      setUploading(false);
    }
  }, [listingId]);

  async function removeImage(imgId) {
    try {
      await uploadApi.deleteImage(imgId);
      setImages(prev => prev.filter(i => i.id !== imgId));
    } catch { toast.error('Erreur de suppression.'); }
  }

  async function setCover(imgId) {
    try {
      await uploadApi.setCover(imgId);
      setImages(prev => prev.map(i => ({ ...i, is_cover: i.id === imgId })));
      toast.success('Photo de couverture mise à jour.');
    } catch { toast.error('Erreur.'); }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Type d'annonce</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Transaction *</label>
            <select {...register('transaction', { required: true })} className={styles.select}>
              <option value="Vente">Vente</option>
              <option value="Location">Location</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Type de bien *</label>
            <select {...register('property_type', { required: true })} className={styles.select}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Titre et description</h3>
        <div className={styles.field}>
          <label>Titre de l'annonce *</label>
          <input
            {...register('title', { required: 'Titre requis', maxLength: 255 })}
            placeholder="Ex : Bel appartement S+3 vue mer La Marsa"
            className={[styles.input, errors.title ? styles.error : ''].join(' ')}
          />
          {errors.title && <span className={styles.err}>{errors.title.message}</span>}
        </div>
        <div className={styles.field}>
          <label>Description</label>
          <textarea
            {...register('description')}
            placeholder="Décrivez votre bien : état, équipements, points forts, environnement..."
            className={styles.textarea}
            rows={5}
          />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Localisation</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Gouvernorat *</label>
            <select {...register('governorate', { required: true })} className={styles.select}>
              <option value="">— Sélectionner —</option>
              {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label>Ville *</label>
            <select
              {...cityField}
              className={[styles.select, errors.city ? styles.error : ''].join(' ')}
              onChange={(e) => {
                cityField.onChange(e);
                handleCitySelect(e.target.value);
              }}
            >
              <option value="">— Sélectionner une ville —</option>
              {TUNISIAN_CITIES.map(city => (
                <option key={city.name} value={city.name}>{city.name}</option>
              ))}
            </select>
            {errors.city && <span className={styles.err}>{errors.city.message}</span>}
          </div>
          <div className={[styles.field, styles.colSpan2].join(' ')}>
            <label>Adresse / Quartier</label>
            <input
              {...register('address')}
              placeholder="Ex : Les Berges du Lac, Corniche, Centre-ville..."
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label>Latitude (optionnel)</label>
            <input type="number" step="any" {...register('latitude')} placeholder="Ex : 36.8065" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label>Longitude (optionnel)</label>
            <input type="number" step="any" {...register('longitude')} placeholder="Ex : 10.1815" className={styles.input} />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Prix</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Prix (DT) *</label>
            <input
              type="number"
              {...register('price', { required: 'Prix requis', min: { value: 0, message: 'Prix invalide' } })}
              placeholder="Ex : 250000"
              className={[styles.input, errors.price ? styles.error : ''].join(' ')}
            />
            {errors.price && <span className={styles.err}>{errors.price.message}</span>}
          </div>
          <div className={styles.field}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
              <input type="checkbox" {...register('price_negotiable')} style={{ width: 16, height: 16, accentColor: 'var(--olive)' }} />
              Prix négociable
            </label>
          </div>
        </div>
      </div>

      {!isTerrain && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Caractéristiques</h3>
          <div className={styles.grid3}>
            <div className={styles.field}>
              <label>Surface (m²)</label>
              <input type="number" {...register('surface', { min: 0 })} placeholder="120" className={styles.input} />
            </div>
            <div className={styles.field}>
              <label>Nombre de pièces</label>
              <input type="number" {...register('rooms', { min: 0 })} placeholder="4" className={styles.input} />
            </div>
            <div className={styles.field}>
              <label>Chambres</label>
              <input type="number" {...register('bedrooms', { min: 0 })} placeholder="3" className={styles.input} />
            </div>
            <div className={styles.field}>
              <label>Salles de bains</label>
              <input type="number" {...register('bathrooms', { min: 0 })} placeholder="2" className={styles.input} />
            </div>
            <div className={styles.field}>
              <label>Étage</label>
              <input type="number" {...register('floor')} placeholder="3" className={styles.input} />
            </div>
            <div className={styles.field}>
              <label>Année construction</label>
              <input type="number" {...register('construction_year')} placeholder="2020" className={styles.input} />
            </div>
          </div>
        </div>
      )}

      {isTerrain && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Caractéristiques du terrain</h3>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Surface (m²)</label>
              <input type="number" {...register('surface', { min: 0 })} placeholder="1200" className={styles.input} />
            </div>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Équipements</h3>
        <div className={styles.checkGrid}>
          {[
            ['is_new', 'Bien neuf'],
            ['is_furnished', 'Meublé'],
            ['has_parking', 'Parking'],
            ['has_elevator', 'Ascenseur'],
            ['has_pool', 'Piscine'],
            ['has_garden', 'Jardin'],
            ['has_terrace', 'Terrasse'],
            ['has_ac', 'Climatisation'],
            ['has_heating', 'Chauffage'],
          ].map(([key, label]) => (
            <label key={key} className={styles.checkLabel}>
              <input type="checkbox" {...register(key)} className={styles.checkbox} />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Upload photos */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Photos {!listingId && <span className={styles.hint}>(disponible après la 1ère sauvegarde)</span>}
        </h3>

        {images.length > 0 && (
          <div className={styles.imgGrid}>
            {images.map(img => (
              <div key={img.id} className={[styles.imgThumb, img.is_cover ? styles.cover : ''].join(' ')}>
                <img src={img.url} alt="" />
                <div className={styles.imgActions}>
                  {!img.is_cover && (
                    <button type="button" onClick={() => setCover(img.id)} title="Définir comme couverture">
                      <Star size={12} />
                    </button>
                  )}
                  <button type="button" onClick={() => removeImage(img.id)} title="Supprimer">
                    <X size={12} />
                  </button>
                </div>
                {img.is_cover && <span className={styles.coverBadge}>Couverture</span>}
              </div>
            ))}
          </div>
        )}

        {listingId && (
          <label className={styles.uploadZone}>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={e => handleFiles(e.target.files)}
              style={{ display: 'none' }}
              disabled={uploading}
            />
            <Upload size={22} />
            <span>{uploading ? 'Upload en cours...' : 'Cliquer ou glisser-déposer des photos'}</span>
            <small>JPG, PNG, WebP — max 10 Mo par photo</small>
          </label>
        )}
      </div>

      <div className={styles.actions}>
        <Button type="submit" variant="primary" size="lg" loading={loading}>
          {defaultValues.id ? 'Mettre à jour l\'annonce' : 'Publier l\'annonce'}
        </Button>
      </div>
    </form>
  );
}
