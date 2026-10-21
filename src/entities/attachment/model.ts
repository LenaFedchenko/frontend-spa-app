
import { request } from '../../shared/api/http';

export interface Attachment {
  id: number;
  comment: number;
  file: string;
  created_at: string;
}

export function uploadAttachment(id: number, file: File) {
  const body = new FormData();
  body.append('file', file);

  return request<Attachment>(`/comments/${id}/attachments/`, {
    method: 'POST',
    body: body,
  });
}

export async function validateAttachment(file: File): Promise<string | null> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'txt'];

  if (!extension || !allowedExtensions.includes(extension)) {
    return 'Choose a JPG, PNG, non-animated GIF, or TXT file.';
  }

  if (extension === 'txt') {
    if (file.size > 100 * 1024) {
      return 'TXT files must be 100 KB or smaller.';
    }

    try {
      const buffer = await file.arrayBuffer();
      const decoder = new TextDecoder('utf-8', { fatal: true });

      decoder.decode(buffer);
    } catch {
      return 'TXT files must use UTF-8 encoding.';
    }
  }

  return null;
}
