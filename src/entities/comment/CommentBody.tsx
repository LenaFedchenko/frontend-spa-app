import { sanitizeHtml } from '../../shared/lib/html';
export function CommentBody({ text }: { text: string }) {
  return <div className="comment-prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }} />;
}
