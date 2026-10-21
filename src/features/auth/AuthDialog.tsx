import { useState, type FormEvent } from 'react';
import { Modal } from '../../shared/ui/Modal';
import { errorMessage } from '../../shared/api/http';
import { useAuth } from './AuthProvider';

type Props = {
  onClose: () => void;
};

export function AuthDialog({ onClose }: Props) {
  const { signIn } = useAuth();

  const [register, setRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  let title = 'Welcome back';
  let description = 'Sign in to join the conversation as yourself.';
  let buttonText = 'Sign in';
  let switchText = 'New here? Create an account';

  if (register) {
    title = 'Make yourself at home';
    description = 'Create an account to put a name to the conversation.';
    buttonText = 'Create account';
    switchText = 'Already a member? Sign in';
  }

  if (busy) {
    buttonText = 'Please wait…';
  }

  function closeDialog() {
    if (!busy) {
      onClose();
    }
  }

  function switchMode() {
    setRegister(!register);
    setError('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBusy(true);
    setError('');

    try {
      if (register) {
        await signIn(username, password, email);
      } else {
        await signIn(username, password);
      }

      onClose();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={closeDialog}>
      <p className="muted">{description}</p>

      <form onSubmit={submit} className="stack">
        <label>
          Username
          <input
            required
            maxLength={150}
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>

        {register && (
          <label>
            Email
            <input
              required
              type="email"
              maxLength={254}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
        )}

        <label>
          Password
          <input
            required
            type="password"
            minLength={register ? 8 : 1}
            autoComplete={register ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}

        <button type="submit" className="primary" disabled={busy}>
          {buttonText}
        </button>

        <button
          type="button"
          className="text-button"
          disabled={busy}
          onClick={switchMode}
        >
          {switchText}
        </button>

        <small className="muted">
          Your session lasts until you reload or close this page.
        </small>
      </form>
    </Modal>
  );
}
