import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useRegister } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import styles from './AuthPage.module.css';

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const signup = useRegister();
  const password = watch('password');

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>Dari<span>.tn</span></div>
        <h1 className={styles.title}>Créer un compte</h1>
        <p className={styles.sub}>Rejoignez la communauté Dari.tn</p>

        <form className={styles.form} onSubmit={handleSubmit(d => signup.mutate(d))}>
          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Prénom *</label>
              <input
                {...register('first_name', { required: 'Prénom requis' })}
                placeholder="Ahmed"
                className={[styles.input, errors.first_name ? styles.err : ''].join(' ')}
                autoComplete="given-name"
              />
              {errors.first_name && <span className={styles.errMsg}>{errors.first_name.message}</span>}
            </div>
            <div className={styles.field}>
              <label>Nom *</label>
              <input
                {...register('last_name', { required: 'Nom requis' })}
                placeholder="Ben Ali"
                className={[styles.input, errors.last_name ? styles.err : ''].join(' ')}
                autoComplete="family-name"
              />
              {errors.last_name && <span className={styles.errMsg}>{errors.last_name.message}</span>}
            </div>
          </div>

          <div className={styles.field}>
            <label>Email *</label>
            <input
              type="email"
              {...register('email', { required: 'Email requis' })}
              placeholder="votre@email.com"
              className={[styles.input, errors.email ? styles.err : ''].join(' ')}
              autoComplete="email"
            />
            {errors.email && <span className={styles.errMsg}>{errors.email.message}</span>}
          </div>

          <div className={styles.field}>
            <label>Téléphone</label>
            <input
              type="tel"
              {...register('phone')}
              placeholder="+216 XX XXX XXX"
              className={styles.input}
              autoComplete="tel"
            />
          </div>

          <div className={styles.field}>
            <label>Mot de passe *</label>
            <input
              type="password"
              {...register('password', {
                required: 'Mot de passe requis',
                minLength: { value: 8, message: 'Minimum 8 caractères' },
                pattern: { value: /[A-Z]/, message: 'Au moins une majuscule requise' },
              })}
              placeholder="••••••••"
              className={[styles.input, errors.password ? styles.err : ''].join(' ')}
              autoComplete="new-password"
            />
            {errors.password && <span className={styles.errMsg}>{errors.password.message}</span>}
          </div>

          <div className={styles.field}>
            <label>Confirmer le mot de passe *</label>
            <input
              type="password"
              {...register('confirm', {
                required: 'Confirmation requise',
                validate: v => v === password || 'Les mots de passe ne correspondent pas',
              })}
              placeholder="••••••••"
              className={[styles.input, errors.confirm ? styles.err : ''].join(' ')}
              autoComplete="new-password"
            />
            {errors.confirm && <span className={styles.errMsg}>{errors.confirm.message}</span>}
          </div>

          <div className={styles.terms}>
            <input
              type="checkbox"
              id="terms"
              {...register('terms', { required: true })}
              style={{ width: 16, height: 16, accentColor: 'var(--olive)', flexShrink: 0 }}
            />
            <label htmlFor="terms" style={{ cursor: 'pointer' }}>
              J'accepte les <a href="#" style={{ color: 'var(--olive)', fontWeight: 600 }}>Conditions d'utilisation</a> et la <a href="#" style={{ color: 'var(--olive)', fontWeight: 600 }}>Politique de confidentialité</a>
            </label>
          </div>
          {errors.terms && <span className={styles.errMsg}>Vous devez accepter les conditions.</span>}

          <Button type="submit" variant="primary" size="lg" loading={signup.isLoading} style={{ width: '100%' }}>
            Créer mon compte
          </Button>
        </form>

        <p className={styles.switch}>
          Déjà un compte ? <Link to="/connexion">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
