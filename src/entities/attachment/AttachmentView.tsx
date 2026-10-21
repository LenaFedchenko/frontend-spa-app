
import { useState } from 'react';
import { fileUrl } from '../../shared/config/env';
import { Modal } from '../../shared/ui/Modal';
import type { Attachment } from './model';

type Props = {
  attachment: Attachment;
};

export function AttachmentView({ attachment }: Props) {
  const [open, setOpen] = useState(false);

  const url = fileUrl(attachment.file);
  const name = attachment.file.split('/').pop() || 'Attachment';
  const isText = url?.split('?')[0].toLowerCase().endsWith('.txt');

  if (!url) {
    return null;
  }

  if (isText) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="file-link"
      >
        {name} ↗
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        className="image-button"
        onClick={() => setOpen(true)}
        aria-label={`View ${name}`}
      >
        <img src={url} alt={name} loading="lazy" />
      </button>

      {open && (
        <Modal title={name} onClose={() => setOpen(false)}>
          <img className="lightbox-image" src={url} alt={name} />

          <a href={url} target="_blank" rel="noopener noreferrer">
            Open original image ↗
          </a>
        </Modal>
      )}
    </>
  );
}
