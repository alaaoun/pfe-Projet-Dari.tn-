import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>Dari<span>.tn</span></div>
          <p>La référence immobilière en Tunisie. Achetez, vendez, louez en toute confiance.</p>
          <div className={styles.social}>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
          </div>
        </div>

        <div className={styles.col}>
          <h4>Rechercher</h4>
          <Link to="/recherche?transaction=Vente">Acheter</Link>
          <Link to="/recherche?transaction=Location">Louer</Link>
          <Link to="/recherche?property_type=Appartement">Appartements</Link>
          <Link to="/recherche?property_type=Villa">Villas</Link>
          <Link to="/recherche?property_type=Bureau">Bureaux</Link>
          <Link to="/recherche?property_type=Terrain">Terrains</Link>
        </div>

        <div className={styles.col}>
          <h4>Villes populaires</h4>
          <Link to="/recherche?city=Tunis">Tunis</Link>
          <Link to="/recherche?city=Sfax">Sfax</Link>
          <Link to="/recherche?city=Sousse">Sousse</Link>
          <Link to="/recherche?city=Monastir">Monastir</Link>
          <Link to="/recherche?city=Nabeul">Nabeul</Link>
          <Link to="/recherche?city=Hammamet">Hammamet</Link>
        </div>

        <div className={styles.col}>
          <h4>Dari.tn</h4>
          <Link to="/publier">Publier une annonce</Link>
          <Link to="/inscription">Créer un compte</Link>
          <Link to="/connexion">Se connecter</Link>
          <a href="mailto:contact@dari.tn">Nous contacter</a>
          <a href="#">Mentions légales</a>
          <a href="#">Politique de confidentialité</a>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} Dari.tn — Tous droits réservés</span>
        <span>Fait avec ♥ en Tunisie 🇹🇳</span>
      </div>
    </footer>
  );
}
