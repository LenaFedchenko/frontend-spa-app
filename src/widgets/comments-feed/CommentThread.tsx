import { useEffect, useRef, useState } from 'react';
import { type Comment, getReplies } from '../../entities/comment/model';
import { CommentBody } from '../../entities/comment/CommentBody';
import { AttachmentView } from '../../entities/attachment/AttachmentView';
import type { Attachment } from '../../entities/attachment/model';
import { CommentForm } from '../../features/create-comment/CommentForm';
import { errorMessage } from '../../shared/api/http';
import { safeLink } from '../../shared/lib/html';
import { Icon } from '../../shared/ui/Icon';
import styles from './CommentThread.module.css';

interface Props {
  comment: Comment;
  depth?: number;
  revisions: Record<number, number>;
  attachments: Record<number, Attachment[]>;
  onCreated: (comment: Comment, attachment?: Attachment) => void;
  ancestors?: number[];
}

export function CommentThread({
  comment,
  depth = 0,
  revisions,
  attachments,
  onCreated,
  ancestors = [],
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replies, setReplies] = useState<Comment[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  const revision = revisions[comment.id];
  const lastRevision = useRef(revision);

  useEffect(() => {
    if (revision !== lastRevision.current) {
      lastRevision.current = revision;

      if (!expanded) {
        setReplies(null);
      }
    }

    if (!expanded) {
      return;
    }

    const controller = new AbortController();

    setBusy(true);
    setError('');

    async function loadReplies() {
      try {
        const result = await getReplies(comment.id, controller.signal);

        if (!controller.signal.aborted) {
          setReplies(result);
        }
      } catch (failure) {
        if (!controller.signal.aborted) {
          setError(errorMessage(failure));
        }
      } finally {
        if (!controller.signal.aborted) {
          setBusy(false);
        }
      }
    }

    void loadReplies();

    return () => {
      controller.abort();
    };
  }, [comment.id, expanded, revision, retry, revisions[-1]]);

  const home = safeLink(comment.home_page);
  const date = new Date(comment.created_at);

  let dateLabel = 'Unknown date';

  if (!Number.isNaN(date.getTime())) {
    dateLabel = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  const path = [...ancestors, comment.id];

  const visibleReplies = (replies || []).filter(reply => {
    return !path.includes(reply.id);
  });

  let repliesText = 'View replies';

  if (expanded) {
    repliesText = 'Hide replies';
  } else if (replies?.length === 0) {
    repliesText = 'Check for replies';
  }

  function toggleReplyForm() {
    setReplying(!replying);
  }

  function toggleReplies() {
    setExpanded(!expanded);
  }

  function replyCreated(created: Comment, attachment?: Attachment) {
    onCreated(created, attachment);
    setReplying(false);
    setExpanded(true);
  }

  function retryLoading() {
    setRetry(previous => previous + 1);
  }

  return (
    <article className={`${styles.comment} ${depth > 0 ? styles.child : ''}`}>
      <header className={styles.header}>
        <div className={styles.author}>
          <span
            className={`${styles.avatar} ${styles[`tone${comment.id % 4}`]}`}
            aria-hidden="true"
          >
            {comment.user_name.slice(0, 2).toUpperCase()}
          </span>

          <strong>{comment.user_name}</strong>

          {home && (
            <a
              href={home}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${comment.user_name}'s home page`}
              className={styles.home}
            >
              <Icon name="link" size={13} />
            </a>
          )}
        </div>

        <time dateTime={comment.created_at} title={dateLabel}>
          {dateLabel}
        </time>
      </header>

      <div className={styles.body}>
        <CommentBody text={comment.text} />

        {attachments[comment.id]?.map(attachment => (
          <AttachmentView
            key={attachment.id}
            attachment={attachment}
          />
        ))}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={toggleReplyForm}
            aria-expanded={replying}
          >
            <Icon name="reply" size={14} />
            Reply
          </button>

          <button
            type="button"
            onClick={toggleReplies}
            aria-expanded={expanded}
          >
            {repliesText}

            {!expanded && (
              <Icon name="chevron" size={12} />
            )}
          </button>

          <span>#{comment.id}</span>
        </div>
      </div>

      {replying && (
        <div className={styles.replyForm}>
          <h3>Reply to {comment.user_name}</h3>

          <CommentForm
            parent={comment.id}
            onCancel={() => setReplying(false)}
            onCreated={replyCreated}
          />
        </div>
      )}

      {expanded && (
        <div
          className={depth < 5 ? styles.replies : styles.deepReplies}
          aria-label={`Replies to ${comment.user_name}`}
        >
          {busy && (
            <p role="status" className={styles.notice}>
              Loading replies…
            </p>
          )}

          {error && (
            <div role="alert" className={styles.notice}>
              <p className="error">{error}</p>

              <button
                type="button"
                className="secondary"
                onClick={retryLoading}
              >
                Try again
              </button>
            </div>
          )}

          {!busy && !error && replies?.length === 0 && (
            <p className={styles.notice}>
              No replies yet. Add the first one.
            </p>
          )}

          {!busy && !error && visibleReplies.map(reply => (
            <CommentThread
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              revisions={revisions}
              attachments={attachments}
              onCreated={onCreated}
              ancestors={path}
            />
          ))}
        </div>
      )}
    </article>
  );
}
