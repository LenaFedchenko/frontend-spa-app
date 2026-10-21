
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getComments,
  type Comment,
  type Order,
  type Page,
  type Sort,
} from '../../entities/comment/model';
import type { Attachment } from '../../entities/attachment/model';
import { CommentSorting } from '../../features/comment-sorting/CommentSorting';
import { Pagination } from '../../features/comment-pagination/Pagination';
import { CommentForm } from '../../features/create-comment/CommentForm';
import { ApiError, errorMessage } from '../../shared/api/http';
import { Icon } from '../../shared/ui/Icon';
import { CommentThread } from './CommentThread';
import { useLiveComments } from './useLiveComments';
import styles from './CommentsFeed.module.css';

export function CommentsFeed() {
  const params = new URLSearchParams(location.search);

  const initialSort = params.get('sort');
  const initialPage = Number(params.get('page'));

  let defaultPage = 1;
  let defaultSort: Sort = 'created_at';
  let defaultOrder: Order = 'desc';

  if (Number.isInteger(initialPage) && initialPage > 0) {
    defaultPage = initialPage;
  }

  if (initialSort === 'email' || initialSort === 'user_name') {
    defaultSort = initialSort;
  }

  if (params.get('order') === 'asc') {
    defaultOrder = 'asc';
  }

  const [page, setPage] = useState(defaultPage);
  const [sort, setSort] = useState<Sort>(defaultSort);
  const [order, setOrder] = useState<Order>(defaultOrder);

  const [data, setData] = useState<Page<Comment> | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [pending, setPending] = useState(false);

  const [revisions, setRevisions] = useState<Record<number, number>>({});
  const [attachments, setAttachments] = useState<Record<number, Attachment[]>>({});

  const heading = useRef<HTMLHeadingElement>(null);

  const invalidate = useCallback((parent: number | null) => {
    if (parent === -1) {
      setRevisions(previous => ({
        ...previous,
        [-1]: (previous[-1] || 0) + 1,
      }));
    } else if (parent !== null) {
      setRevisions(previous => ({
        ...previous,
        [parent]: (previous[parent] || 0) + 1,
      }));
    } else {
      setPending(true);
    }
  }, []);

  const status = useLiveComments(invalidate);

  useEffect(() => {
    const controller = new AbortController();

    setBusy(true);
    setError('');

    const url = new URL(window.location.href);

    url.searchParams.set('page', String(page));
    url.searchParams.set('sort', sort);
    url.searchParams.set('order', order);

    window.history.replaceState(null, '', url);

    async function loadComments() {
      try {
        const result = await getComments(
          page,
          sort,
          order,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (failure) {
        if (controller.signal.aborted) {
          return;
        }

        if (failure instanceof ApiError && failure.status === 404 && page > 1) {
          setPage(1);
        } else {
          setError(errorMessage(failure));
        }
      } finally {
        if (!controller.signal.aborted) {
          setBusy(false);
        }
      }
    }

    void loadComments();

    return () => {
      controller.abort();
    };
  }, [page, sort, order, refresh]);

  function created(comment: Comment, attachment?: Attachment) {
    if (attachment) {
      setAttachments(previous => ({
        ...previous,
        [comment.id]: [
          ...(previous[comment.id] || []),
          attachment,
        ],
      }));
    }

    if (comment.parent !== null) {
      invalidate(comment.parent);
    } else {
      setPage(1);
      setSort('created_at');
      setOrder('desc');
      setRefresh(previous => previous + 1);
      setPending(false);
    }
  }

  function changePage(next: number) {
    setPage(next);

    heading.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  function changeSorting(nextSort: Sort, nextOrder: Order) {
    setSort(nextSort);
    setOrder(nextOrder);
    setPage(1);
  }

  function refreshComments() {
    setRefresh(previous => previous + 1);
    setPending(false);
  }

  let connectionText = 'Updates offline';
  let connectionTitle = 'Use refresh to check for new comments';

  if (status === 'live') {
    connectionText = 'Live updates';
    connectionTitle = 'Updates arrive in real time';
  } else if (status === 'connecting') {
    connectionText = 'Connecting';
  }

  return (
    <>
      <section aria-labelledby="discussion-title">
        <div className={styles.feedHeading}>
          <div className={styles.titleGroup}>
            <h2 id="discussion-title" ref={heading}>
              All discussions
            </h2>

            {data && (
              <span className={styles.count}>
                {data.count}
              </span>
            )}
          </div>

          <span
            className={`${styles.connection} ${status === 'live' ? styles.live : ''}`}
            title={connectionTitle}
          >
            <span />
            {connectionText}
          </span>
        </div>

        <div className={styles.controls}>
          <span className="muted">
            A place for every perspective.
          </span>

          <CommentSorting
            sort={sort}
            order={order}
            onChange={changeSorting}
          />
        </div>

        {pending && (
          <button
            type="button"
            className={styles.update}
            onClick={refreshComments}
          >
            New activity in the discussion. Refresh comments
            <Icon name="refresh" size={14} />
          </button>
        )}

        <div aria-busy={busy} className={styles.list}>
          {busy && (
            <div className={styles.loading} role="status">
              <span className="spinner" />
              Loading discussions…
            </div>
          )}

          {!busy && error && (
            <div className={styles.state} role="alert">
              <Icon name="chat" size={30} />

              <h3>We couldn’t load the conversation</h3>
              <p>{error}</p>

              <button
                type="button"
                className="secondary"
                onClick={refreshComments}
              >
                Try again
              </button>
            </div>
          )}

          {!busy && !error && data?.results.length === 0 && (
            <div className={styles.state}>
              <Icon name="chat" size={32} />

              <h3>Good conversations start somewhere.</h3>

              <p>
                Be the first to share a thought with the community.
              </p>

              <a className="secondary" href="#join">
                Start a discussion
              </a>
            </div>
          )}

          {!busy && !error && data?.results.map(comment => (
            <CommentThread
              key={comment.id}
              comment={comment}
              revisions={revisions}
              attachments={attachments}
              onCreated={created}
            />
          ))}
        </div>

        {!busy && !error && data && (
          <Pagination
            page={page}
            count={data.count}
            onChange={changePage}
          />
        )}

        {status !== 'live' && !busy && !error && (
          <button
            type="button"
            className="text-button"
            onClick={refreshComments}
          >
            Refresh comments
          </button>
        )}
      </section>

      <section
        className={styles.composer}
        id="join"
        aria-labelledby="join-title"
      >
        <div className={styles.composerHeading}>
          <span className={styles.composeIcon}>
            <Icon name="chat" size={20} />
          </span>

          <div>
            <h2 id="join-title">
              Join the conversation
            </h2>

            <p>
              You don’t need an account. Just something to say.
            </p>
          </div>
        </div>

        <CommentForm onCreated={created} />
      </section>
    </>
  );
}
