
import { useEffect, useRef, useState } from 'react';
import { socketUrl } from '../../shared/config/env';

type Status = 'connecting' | 'live' | 'offline';

export function useLiveComments(onCreated: (parent: number | null) => void) {
  const callback = useRef(onCreated);
  callback.current = onCreated;

  const [status, setStatus] = useState<Status>('connecting');

  useEffect(() => {
    let stopped = false;
    let socket: WebSocket | undefined;
    let timer: ReturnType<typeof setTimeout>;
    let flushTimer: ReturnType<typeof setTimeout>;
    let attempt = 0;
    let connectedBefore = false;

    const seen = new Set<number>();
    const parents = new Set<number | null>();

    function reconnect() {
      if (stopped) {
        return;
      }

      setStatus('offline');

      const delay = Math.min(30000, 1000 * Math.pow(2, Math.min(attempt, 5)));
      attempt += 1;

      timer = setTimeout(connect, delay + Math.random() * 500);
    }

    function handleMessage(event: MessageEvent) {
      try {
        const data: unknown = JSON.parse(String(event.data));

        if (!data || typeof data !== 'object') {
          return;
        }

        if (!('event' in data) || data.event !== 'comment.created') {
          return;
        }

        if (!('comment' in data)) {
          return;
        }

        const comment = data.comment;

        if (!comment || typeof comment !== 'object') {
          return;
        }

        if (!('id' in comment) || typeof comment.id !== 'number') {
          return;
        }

        if (!('parent' in comment)) {
          return;
        }

        if (comment.parent !== null && typeof comment.parent !== 'number') {
          return;
        }

        if (seen.has(comment.id)) {
          return;
        }

        seen.add(comment.id);

        if (seen.size > 1000) {
          const first = seen.values().next().value;

          if (first !== undefined) {
            seen.delete(first);
          }
        }

        parents.add(comment.parent);

        clearTimeout(flushTimer);

        flushTimer = setTimeout(() => {
          for (const parent of parents) {
            callback.current(parent);
          }

          parents.clear();
        }, 200);
      } catch {
        return;
      }
    }

    function connect() {
      if (stopped) {
        return;
      }

      setStatus('connecting');

      try {
        socket = new WebSocket(socketUrl());
      } catch {
        reconnect();
        return;
      }

      socket.onopen = () => {
        setStatus('live');
        attempt = 0;

        if (connectedBefore) {
          callback.current(-1);
          callback.current(null);
        }

        connectedBefore = true;
      };

      socket.onmessage = handleMessage;

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = reconnect;
    }

    connect();

    return () => {
      stopped = true;

      clearTimeout(timer);
      clearTimeout(flushTimer);

      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    };
  }, []);

  return status;
}
