
import { useState } from 'react';
import { useAuth } from '../../features/auth/AuthProvider';
import { AuthDialog } from '../../features/auth/AuthDialog';
import { errorMessage } from '../../shared/api/http';
import { Icon } from '../../shared/ui/Icon';
import styles from './Header.module.css';

export function Header() {
  const { user, signOut } = useAuth();

  const [authOpen, setAuthOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    setError('');

    try {
      await signOut();
    } catch (failure) {
      setError(
        `Signed out locally. Server logout failed: ${errorMessage(failure)}`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <a
            className={styles.brand}
            href="/"
            aria-label="Common Ground home"
          >
            <span className={styles.mark}>
              <Icon name="chat" size={21} />
            </span>

            common
            <span className={styles.ground}>ground</span>
            <span className={styles.brandDot}>.</span>
          </a>

          <nav aria-label="Main navigation" className={styles.nav}>
            <a href="#discussions" className={styles.active}>
              Discussions
            </a>

            <a href="#community">
              Community
            </a>
          </nav>

          <div className={styles.account}>
            {user ? (
              <>
                <span className={styles.username}>
                  {user.username}
                </span>

                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <span className={styles.guest}>
                  You’re browsing as a guest
                </span>

                <button
                  type="button"
                  className="secondary"
                  onClick={() => setAuthOpen(true)}
                >
                  Sign in
                  <span aria-hidden="true">↗</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {error && (
        <p role="alert" className="global-error">
          {error}

          <button
            type="button"
            className="text-button"
            onClick={() => setError('')}
          >
            Dismiss
          </button>
        </p>
      )}

      {authOpen && (
        <AuthDialog onClose={() => setAuthOpen(false)} />
      )}
    </>
  );
}
