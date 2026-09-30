import React from 'react';
import clsx from 'clsx';
import Spinner from './Spinner';
import styles from './Button.module.css';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size,
  loading = false,
  disabled,
  className,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(
        styles.btn,
        styles[variant],
        size === 'lg' && styles.lg,
        loading && styles.loading,
        className,
      )}
      {...props}
    >
      {loading && <Spinner size={size === 'lg' ? 18 : 14} />}
      <span className={styles.label}>{children}</span>
    </button>
  );
}
