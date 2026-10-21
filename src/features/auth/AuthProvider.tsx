import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  getRefreshToken,
  request,
  sessionExpired,
  setSession,
} from '../../shared/api/http';

import type { Tokens, User } from '../../entities/user/model';

interface Auth {
  user: User | null;
  signIn: (username: string, password: string, email?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

type Props = {
  children: ReactNode;
};

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return sessionExpired(() => {
      setUser(null);
    });
  }, []);

  async function signIn(username: string, password: string, email?: string) {
    let url = '/api/auth/login/';

    const body: {
      username: string;
      password: string;
      email?: string;
    } = {
      username,
      password,
    };

    if (email !== undefined) {
      url = '/api/auth/register/';
      body.email = email;
    }

    const result = await request<Tokens & { user?: User }>(
      url,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      false,
    );

    setSession(result.access, result.refresh);

    try {
      if (result.user) {
        setUser(result.user);
      } else {
        const currentUser = await request<User>('/api/auth/me/');
        setUser(currentUser);
      }
    } catch (error) {
      setSession(null, null);
      throw error;
    }
  }

  async function signOut() {
    const refresh = getRefreshToken();

    setSession(null, null);
    setUser(null);

    if (refresh) {
      await request(
        '/api/auth/logout/',
        {
          method: 'POST',
          body: JSON.stringify({ refresh }),
        },
        false,
      );
    }
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error('Authentication provider is missing.');
  }

  return auth;
}
