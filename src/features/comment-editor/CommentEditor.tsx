
import { useId, useRef, useState } from 'react';
import { CommentBody } from '../../entities/comment/CommentBody';
import { escapeAttribute, safeLink } from '../../shared/lib/html';
import { Icon } from '../../shared/ui/Icon';
import styles from './CommentEditor.module.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

type Tag = 'i' | 'strong' | 'code' | 'a';

export function CommentEditor({ value, onChange, error }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selection = useRef({ start: 0, end: 0 });

  const id = useId();

  const [preview, setPreview] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState('');

  function wrap(tag: Tag) {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    let start = textarea.selectionStart;
    let end = textarea.selectionEnd;

    if (tag === 'a') {
      start = selection.current.start;
      end = selection.current.end;
    }

    const selectedText = value.slice(start, end);

    let openingTag = `<${tag}>`;

    if (tag === 'a') {
      if (!safeLink(url)) {
        return;
      }

      openingTag = `<a href="${escapeAttribute(url)}">`;
    }

    const newText =
      value.slice(0, start) +
      openingTag +
      selectedText +
      `</${tag}>` +
      value.slice(end);

    onChange(newText);
    setLinkOpen(false);

    requestAnimationFrame(() => {
      textarea.focus();

      textarea.setSelectionRange(
        start + openingTag.length,
        start + openingTag.length + selectedText.length,
      );
    });
  }

  function toggleLink() {
    const textarea = textareaRef.current;

    if (textarea) {
      selection.current = {
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
      };
    }

    setLinkOpen(!linkOpen);
  }

  return (
    <div>
      <label htmlFor={id}>
        Your comment <span className="required">*</span>
      </label>

      <div className={`${styles.editor} ${error ? styles.invalid : ''}`}>
        <div className={styles.toolbar}>
          <div className={styles.tools} aria-label="Text formatting">
            <button
              type="button"
              disabled={preview}
              aria-label="Bold"
              onClick={() => wrap('strong')}
            >
              <strong>B</strong>
            </button>

            <button
              type="button"
              disabled={preview}
              aria-label="Italic"
              onClick={() => wrap('i')}
            >
              <i>I</i>
            </button>

            <button
              type="button"
              disabled={preview}
              aria-label="Code"
              onClick={() => wrap('code')}
            >
              <span>〈/〉</span>
            </button>

            <button
              type="button"
              disabled={preview}
              aria-label="Insert link"
              aria-expanded={linkOpen}
              onClick={toggleLink}
            >
              <Icon name="link" size={16} />
            </button>
          </div>

          <button
            type="button"
            className={styles.previewButton}
            aria-pressed={preview}
            onClick={() => setPreview(!preview)}
          >
            {preview ? 'Write' : 'Preview'}
          </button>
        </div>

        {linkOpen && (
          <div className={styles.linkInput}>
            <input
              aria-label="Link URL"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />

            <button
              type="button"
              className="secondary"
              disabled={!safeLink(url)}
              onClick={() => wrap('a')}
            >
              Insert
            </button>
          </div>
        )}

        <textarea
          id={id}
          ref={textareaRef}
          hidden={preview}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Share a thought, ask a question, or add to the conversation…"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />

        {preview && (
          <div className={styles.preview}>
            {value ? (
              <CommentBody text={value} />
            ) : (
              <span className="muted">
                Your preview will appear here.
              </span>
            )}
          </div>
        )}

        <div className={styles.hint}>
          Simple HTML supported: &lt;strong&gt;, &lt;i&gt;, &lt;code&gt;, &lt;a&gt;
        </div>
      </div>

      {error && (
        <span className="field-error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}
