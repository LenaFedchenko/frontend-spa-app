
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { createComment, type Comment, type CommentInput } from '../../entities/comment/model';
import { uploadAttachment, validateAttachment, type Attachment } from '../../entities/attachment/model';
import { ApiError, errorMessage, request } from '../../shared/api/http';
import { fileUrl } from '../../shared/config/env';
import { Icon } from '../../shared/ui/Icon';
import { CommentEditor } from '../comment-editor/CommentEditor';
import { useAuth } from '../auth/AuthProvider';
import styles from './CommentForm.module.css';

interface Captcha {
  captcha_hashkey: string;
  image_url: string;
}

interface Props {
  parent?: number;
  onCreated: (comment: Comment, attachment?: Attachment) => void;
  onCancel?: () => void;
}

const blank: CommentInput = {
  user_name: '',
  email: '',
  home_page: '',
  text: '',
  captcha_hashkey: '',
  captcha_code: '',
};

export function CommentForm({ parent, onCreated, onCancel }: Props) {
  const { user } = useAuth();
  const id = useId();

  const [values, setValues] = useState<CommentInput>({
    ...blank,
    user_name: user?.username || '',
    email: user?.email || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaError, setCaptchaError] = useState('');
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [saved, setSaved] = useState<Comment | null>(null);
  const [message, setMessage] = useState('');

  const captchaSequence = useRef(0);
  const captchaController = useRef<AbortController | null>(null);
  const fileSequence = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setValues(previous => ({
        ...previous,
        user_name: user.username,
        email: user.email,
      }));
    }
  }, [user]);

  async function refreshCaptcha() {
    captchaController.current?.abort();

    const controller = new AbortController();
    captchaController.current = controller;

    const sequence = ++captchaSequence.current;

    setCaptchaLoading(true);
    setCaptchaError('');
    setCaptcha(null);

    setValues(previous => ({
      ...previous,
      captcha_code: '',
      captcha_hashkey: '',
    }));

    try {
      const result = await request<Captcha>(
        '/api/captcha/',
        { signal: controller.signal },
        false,
      );

      if (sequence === captchaSequence.current) {
        setCaptcha(result);

        setValues(previous => ({
          ...previous,
          captcha_hashkey: result.captcha_hashkey,
        }));
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        setCaptchaError(errorMessage(failure));
      }
    } finally {
      if (sequence === captchaSequence.current) {
        setCaptchaLoading(false);
      }
    }
  }

  useEffect(() => {
    void refreshCaptcha();

    const timer = window.setInterval(() => {
      void refreshCaptcha();
    }, 4 * 60 * 1000);

    return () => {
      clearInterval(timer);
      captchaController.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!file || file.name.toLowerCase().endsWith('.txt')) {
      setPreview('');
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  function change(field: keyof CommentInput, value: string) {
    setValues(previous => ({
      ...previous,
      [field]: value,
    }));

    setErrors(previous => ({
      ...previous,
      [field]: '',
    }));
  }

  async function selectFile(next?: File) {
    const sequence = ++fileSequence.current;

    setFile(null);

    if (!next) {
      return;
    }

    const error = await validateAttachment(next);

    if (sequence !== fileSequence.current) {
      return;
    }

    setErrors(previous => ({
      ...previous,
      file: error || '',
    }));

    if (!error) {
      setFile(next);
    } else if (fileInput.current) {
      fileInput.current.value = '';
    }
  }

  function removeFile() {
    fileSequence.current += 1;
    setFile(null);

    if (fileInput.current) {
      fileInput.current.value = '';
    }
  }

  function complete(comment: Comment, attachment?: Attachment) {
    setValues(previous => ({
      ...blank,
      user_name: previous.user_name,
      email: previous.email,
      home_page: previous.home_page,
    }));

    setFile(null);
    setSaved(null);
    setErrors({});

    if (fileInput.current) {
      fileInput.current.value = '';
    }

    if (parent) {
      setMessage('Your reply has been posted.');
    } else {
      setMessage('Your comment has been posted.');
    }

    void refreshCaptcha();
    onCreated(comment, attachment);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!saved) {
      const next: Record<string, string> = {};

      if (!/^[a-zA-Z0-9]+$/.test(values.user_name)) {
        next.user_name = 'Use Latin letters and digits only.';
      }

      if (!values.email.trim()) {
        next.email = 'Enter your email address.';
      }

      if (!values.text.trim()) {
        next.text = 'Write a comment before posting.';
      } else {
        const parsed = new DOMParser().parseFromString(
          `<root>${values.text}</root>`,
          'application/xml',
        );

        if (parsed.querySelector('parsererror')) {
          next.text = 'Close all HTML tags and write &amp; for literal ampersands. The server requires well-formed HTML.';
        }
      }

      if (!values.captcha_code.trim()) {
        next.captcha_code = 'Enter the code shown in the image.';
      }

      if (!values.captcha_hashkey) {
        next.captcha_code = 'Load a CAPTCHA before posting.';
      }

      setErrors(next);

      if (Object.keys(next).length > 0) {
        firstField.current?.focus();
        return;
      }
    }

    setBusy(true);

    let created = saved;

    try {
      if (!created) {
        created = await createComment(values, parent);
        setSaved(created);
      }

      let attachment: Attachment | undefined;

      if (file) {
        attachment = await uploadAttachment(created.id, file);
      }

      complete(created, attachment);
    } catch (failure) {
      if (created) {
        setErrors({
          file: `Your comment was posted, but the attachment failed: ${errorMessage(failure)}. Retry the upload or finish without it.`,
        });
      } else {
        if (failure instanceof ApiError) {
          setErrors({
            ...failure.fields,
            form: failure.message,
          });
        } else {
          setErrors({
            form: errorMessage(failure),
          });
        }

        void refreshCaptcha();
      }
    } finally {
      setBusy(false);
    }
  }

  let submitText = 'Post comment';

  if (parent) {
    submitText = 'Post reply';
  }

  if (saved) {
    submitText = 'Retry upload';
  }

  if (busy) {
    if (saved) {
      submitText = 'Uploading…';
    } else {
      submitText = 'Posting…';
    }
  }

  return (
    <form onSubmit={submit} className={styles.form}>
      <fieldset disabled={busy || !!saved} className={styles.fields}>
        <div className={styles.identity}>
          <label htmlFor={`${id}-name`}>
            User name <span className="required">*</span>

            <input
              ref={firstField}
              id={`${id}-name`}
              required
              maxLength={100}
              pattern="[a-zA-Z0-9]+"
              autoComplete="nickname"
              placeholder="Your name"
              value={values.user_name}
              onChange={event => change('user_name', event.target.value)}
              aria-invalid={!!errors.user_name}
              aria-describedby={errors.user_name ? `${id}-name-error` : undefined}
            />

            {errors.user_name && (
              <span id={`${id}-name-error`} className="field-error">
                {errors.user_name}
              </span>
            )}
          </label>

          <label htmlFor={`${id}-email`}>
            Email <span className="required">*</span>

            <input
              id={`${id}-email`}
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              placeholder="you@example.com"
              value={values.email}
              onChange={event => change('email', event.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={`${id}-email-help`}
            />

            <small
              id={`${id}-email-help`}
              className={errors.email ? 'field-error' : 'muted'}
            >
              {errors.email || 'Your email is public. Choose an address you’re comfortable sharing.'}
            </small>
          </label>
        </div>

        <label htmlFor={`${id}-home`}>
          Home page <span className="optional">(optional)</span>

          <input
            id={`${id}-home`}
            type="url"
            maxLength={200}
            placeholder="https://your-website.com"
            value={values.home_page}
            onChange={event => change('home_page', event.target.value)}
            aria-invalid={!!errors.home_page}
          />

          {errors.home_page && (
            <span className="field-error">{errors.home_page}</span>
          )}
        </label>

        <CommentEditor
          value={values.text}
          onChange={value => change('text', value)}
          error={errors.text}
        />
      </fieldset>

      <div className={styles.attachment}>
        <label className={styles.attachLabel}>
          <Icon name="clip" size={16} />

          <span>
            {file ? file.name : 'Attach a file'}

            <input
              ref={fileInput}
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.txt"
              disabled={busy}
              onChange={event => {
                void selectFile(event.target.files?.[0]);
              }}
            />
          </span>
        </label>

        {file && (
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={removeFile}
          >
            Remove
          </button>
        )}

        <small className="muted">
          JPG, PNG, static GIF · TXT up to 100 KB
        </small>
      </div>

      {preview && (
        <img
          className={styles.filePreview}
          src={preview}
          alt="Selected attachment preview"
        />
      )}

      {errors.file && (
        <p role="alert" className="error">
          {errors.file}
        </p>
      )}

      {!saved && (
        <div className={styles.captchaArea}>
          <label htmlFor={`${id}-captcha`}>
            Security check <span className="required">*</span>
          </label>

          <div className={styles.captchaRow}>
            <div className={styles.captchaImage}>
              {captcha ? (
                <img
                  src={fileUrl(captcha.image_url)}
                  alt="CAPTCHA: type the characters shown"
                  onError={() => setCaptchaError('CAPTCHA image could not load. Please refresh it.')}
                />
              ) : (
                <span>{captchaLoading ? 'Loading…' : 'Unavailable'}</span>
              )}
            </div>

            <button
              type="button"
              className="icon-button"
              aria-label="Refresh CAPTCHA"
              disabled={captchaLoading || busy}
              onClick={() => {
                void refreshCaptcha();
              }}
            >
              <Icon name="refresh" size={17} />
            </button>

            <input
              id={`${id}-captcha`}
              required
              disabled={busy || captchaLoading}
              autoComplete="off"
              placeholder="Enter code"
              value={values.captcha_code}
              onChange={event => change('captcha_code', event.target.value)}
              aria-invalid={!!errors.captcha_code}
              aria-describedby={`${id}-captcha-help`}
            />
          </div>

          <small
            id={`${id}-captcha-help`}
            className={errors.captcha_code || errors.captcha_hashkey ? 'field-error' : 'muted'}
          >
            {errors.captcha_code ||
              errors.captcha_hashkey ||
              'Enter the characters shown in the image.'}
          </small>

          {captchaError && (
            <p role="alert" className="error">
              {captchaError}
            </p>
          )}
        </div>
      )}

      {errors.form && (
        <p role="alert" className="error">
          {errors.form}
        </p>
      )}

      {message && (
        <p role="status" className="success">
          {message}
        </p>
      )}

      <div className={styles.footer}>
        <span className="muted">
          A little thoughtfulness goes a long way.
        </span>

        <div className={styles.actions}>
          {onCancel && (
            <button
              type="button"
              className="secondary"
              disabled={busy || !!saved}
              onClick={onCancel}
            >
              Cancel
            </button>
          )}

          {saved && (
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => complete(saved)}
            >
              Finish without attachment
            </button>
          )}

          <button
            type="submit"
            className="primary"
            disabled={busy || (!saved && (!captcha || !!captchaError))}
          >
            {submitText}
            <Icon name="arrow" size={15} />
          </button>
        </div>
      </div>
    </form>
  );
}
