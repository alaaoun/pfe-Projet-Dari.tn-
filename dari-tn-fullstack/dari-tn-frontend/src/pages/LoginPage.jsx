import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useLogin } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import styles from './AuthPage.module.css';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const login = useLogin();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>Dari<span>.tn</span></div>
        <h1 className={styles.title}>Connexion</h1>
        <p className={styles.sub}>Accédez à votre espace personnel</p>

        <form className={styles.form} onSubmit={handleSubmit(d => login.mutate(d))}>
          <div className={styles.field}>
            <label>Email</label>
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
            <label>Mot de passe</label>
            <input
              type="password"
              {...register('password', { required: 'Mot de passe requis' })}
              placeholder="••••••••"
              className={[styles.input, errors.password ? styles.err : ''].join(' ')}
              autoComplete="current-password"
            />
            {errors.password && <span className={styles.errMsg}>{errors.password.message}</span>}
          </div>

          <Button type="submit" variant="primary" size="lg" loading={login.isLoading} style={{ width: '100%' }}>
            Se connecter
          </Button>
        </form>

        <p className={styles.switch}>
          Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
        </p>

      </div>
    </div>
  );
}
