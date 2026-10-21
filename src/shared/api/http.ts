import { apiBase } from '../config/env';

export class ApiError extends Error {
  constructor(
    public status: number,
    public fields: Record<string, string>,
    message: string,
  ) {
    super(message);
  }
}

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshing: Promise<boolean> | null = null;
let sessionVersion = 0;
let onExpired: (() => void) | undefined;

export function setSession(access: string | null, refresh: string | null) {
  sessionVersion += 1;
  accessToken = access;
  refreshToken = refresh;
}

export function getRefreshToken() {
  return refreshToken;
}

export function sessionExpired(callback: () => void) {
  onExpired = callback;

  return () => {
    onExpired = undefined;
  };
}

async function refreshAccess(): Promise<boolean> {
  if (!refreshToken) {
    return false;
  }

  if (refreshing) {
    return refreshing;
  }

  const version = sessionVersion;
  const token = refreshToken;

  refreshing = (async () => {
    try {
      const response = await fetch(`${apiBase}/api/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: token }),
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) {
        return false;
      }

      const data: unknown = await response.json();

      if (!data || typeof data !== 'object') {
        return false;
      }

      if (!('access' in data) || typeof data.access !== 'string') {
        return false;
      }

      if (version !== sessionVersion) {
        return false;
      }

      accessToken = data.access;

      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshing = null;
  });

  return refreshing;
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
): Promise<T> {
  function send() {
    const headers = new Headers(options.headers);

    if (options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (authenticated && accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const timeout = AbortSignal.timeout(20000);

    let signal: AbortSignal = timeout;

    if (options.signal) {
      signal = AbortSignal.any([options.signal, timeout]);
    }

    return fetch(`${apiBase}${path}`, {
      ...options,
      headers,
      signal,
    });
  }

  let response: Response;

  try {
    response = await send();

    if (response.status === 401 && authenticated && accessToken) {
      const refreshed = await refreshAccess();

      if (refreshed) {
        response = await send();
      } else {
        setSession(null, null);
        onExpired?.();
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    throw new Error(
      'Unable to reach the server. Please check your connection and try again.',
    );
  }

  const text = await response.text();

  let data: unknown;

  try {
    if (text) {
      data = JSON.parse(text);
    }
  } catch {
    data = undefined;
  }

  if (!response.ok) {
    const fields: Record<string, string> = {};

    if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          fields[key] = value.map(String).join(' ');
        } else {
          fields[key] = String(value);
        }
      }
    }

    const message =
      fields.detail ||
      fields.error ||
      fields.non_field_errors ||
      Object.values(fields)[0] ||
      `Request failed (${response.status}). Please try again.`;

    throw new ApiError(response.status, fields, message);
  }

  return data as T;
}

export function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}
