const configuredApi = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const apiBase = import.meta.env.DEV ? '/backend' : configuredApi;

export function fileUrl(value: string): string {
  try {
    const base = configuredApi || window.location.origin;
    const url = new URL(value, base);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }

    if (import.meta.env.DEV) {
      return `/backend${url.pathname}${url.search}`;
    }

    return url.href;
  } catch {
    return '';
  }
}

export function socketUrl(): string {
  if (import.meta.env.DEV) {
    let protocol = 'ws:';

    if (window.location.protocol === 'https:') {
      protocol = 'wss:';
    }

    return `${protocol}//${window.location.host}/ws/comments/`;
  }

  const base = import.meta.env.VITE_WS_URL || configuredApi || window.location.origin;
  const url = new URL('/ws/comments/', base);

  if (window.location.protocol === 'https:') {
    url.protocol = 'wss:';
  } else if (url.protocol === 'http:') {
    url.protocol = 'ws:';
  }

  return url.href;
}
