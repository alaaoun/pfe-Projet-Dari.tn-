import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.code}>404</div>
        <h1 className={styles.title}>Page introuvable</h1>
        <p className={styles.sub}>
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className={styles.actions}>
          <button className={styles.back} onClick={() => navigate(-1)}>
            ← Retour
          </button>
          <Link to="/" className={styles.home}>Aller à l'accueil</Link>
          <Link to="/recherche" className={styles.search}>Rechercher un bien</Link>
        </div>
      </div>
    </div>
  );
}
