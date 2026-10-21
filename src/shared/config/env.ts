const configuredApi = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const apiBase = import.meta.env.DEV
  ? '/backend'
  : configuredApi || '/backend';

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

    if (!configuredApi) {
      return `${url.pathname}${url.search}`;
    }

    return url.href;
  } catch {
    return '';
  }
}

export function socketUrl(): string {
  const configuredWs = import.meta.env.VITE_WS_URL;

  if (configuredWs) {
    const url = new URL('/ws/comments/', configuredWs);

    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';

    return url.href;
  }

  const protocol = window.location.protocol === 'https:'
    ? 'wss:'
    : 'ws:';

  return `${protocol}//${window.location.host}/ws/comments/`;
}
