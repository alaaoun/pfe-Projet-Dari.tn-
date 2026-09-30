import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Heart, Plus, User, LogOut, ChevronDown, Menu, X, Calendar } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/auth.api';
import toast from 'react-hot-toast';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, token, refreshToken, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [dropOpen, setDropOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleLogout() {
    try {
      await authApi.logout(refreshToken);
    } catch (_) {}
    logout();
    navigate('/');
    toast('À bientôt !');
  }

  const isAdmin = user?.role === 'admin';
  const dashboardPath = token ? (isAdmin ? '/admin' : '/client') : '/connexion';
  const dashboardLabel = isAdmin ? 'Espace admin' : 'Mon espace';

  return (
    <header className={[styles.nav, scrolled ? styles.scrolled : ''].join(' ')}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          Dari<span>.tn</span>
        </Link>

        {/* Nav links (desktop) */}
        <nav className={styles.links}>
          <NavLink to="/recherche" className={({ isActive }) =>
            [styles.link, isActive ? styles.active : ''].join(' ')}>
            Rechercher
          </NavLink>
          {token && (
            <NavLink to="/rendez-vous" className={({ isActive }) =>
              [styles.link, isActive ? styles.active : ''].join(' ')}>
              <Calendar size={14} /> Rendez-vous
            </NavLink>
          )}
          <NavLink to="/publier" className={({ isActive }) =>
            [styles.link, isActive ? styles.active : ''].join(' ')}>
            Publier
          </NavLink>
          {token && (
            <NavLink to={dashboardPath} className={({ isActive }) =>
              [styles.link, isActive ? styles.active : ''].join(' ')}>
              {dashboardLabel}
            </NavLink>
          )}
        </nav>

        {/* Actions (desktop) */}
        <div className={styles.actions}>
          {token ? (
            <>
              <Link to="/favoris" className={styles.iconBtn} title="Mes favoris">
                <Heart size={18} />
              </Link>
              <Link to="/publier" className={styles.publishBtn}>
                <Plus size={15} /> Publier
              </Link>
              <div className={styles.userMenu} ref={dropRef}>
                <button className={styles.userBtn} onClick={() => setDropOpen(v => !v)}>
                  <div className={styles.avatar}>
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                  <ChevronDown size={14} />
                </button>
                {dropOpen && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropHeader}>
                      <strong>{user?.first_name} {user?.last_name}</strong>
                      <span>{user?.email}</span>
                    </div>
                    <Link to="/profil" className={styles.dropItem} onClick={() => setDropOpen(false)}>
                      <User size={14} /> Mon profil
                    </Link>
                    <Link to="/favoris" className={styles.dropItem} onClick={() => setDropOpen(false)}>
                      <Heart size={14} /> Mes favoris
                    </Link>
                    <Link to={dashboardPath} className={styles.dropItem} onClick={() => setDropOpen(false)}>
                      <Calendar size={14} /> {dashboardLabel}
                    </Link>
                    <div className={styles.dropDivider} />
                    <button className={[styles.dropItem, styles.dropLogout].join(' ')} onClick={handleLogout}>
                      <LogOut size={14} /> Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/connexion" className={styles.loginBtn}>Se connecter</Link>
              <Link to="/inscription" className={styles.publishBtn}>
                <Plus size={15} /> Publier
              </Link>
            </>
          )}

          {/* Mobile toggle */}
          <button className={styles.mobileToggle} onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <NavLink to="/recherche" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
            Rechercher
          </NavLink>
          <NavLink to="/publier" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
            Publier une annonce
          </NavLink>
          {token ? (
            <>
              <NavLink to="/rendez-vous" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                Rendez-vous
              </NavLink>
              <NavLink to="/favoris" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                Mes favoris
              </NavLink>
              <NavLink to="/profil" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                Mon profil
              </NavLink>
              <NavLink to={dashboardPath} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                {dashboardLabel}
              </NavLink>
              <button className={[styles.mobileLink, styles.mobileLogout].join(' ')} onClick={handleLogout}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <NavLink to="/connexion"  className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                Se connecter
              </NavLink>
              <NavLink to="/inscription" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                Créer un compte
              </NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
}
