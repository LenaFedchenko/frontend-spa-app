import { request } from '../../shared/api/http';

export interface Comment {
  id: number;
  user_name: string;
  email: string;
  home_page: string;
  text: string;
  created_at: string;
  parent: number | null;
  user: number | null;
}
export interface Page<T> { count: number; next: string | null; previous: string | null; results: T[] }
export type Sort = 'created_at' | 'user_name' | 'email';
export type Order = 'asc' | 'desc';
export interface CommentInput {
  user_name: string; email: string; home_page: string; text: string;
  captcha_hashkey: string; captcha_code: string;
}
export const getComments = (page: number, sort: Sort, order: Order, signal?: AbortSignal) =>
  request<Page<Comment>>(`/comments/?page=${page}&sort=${sort}&order=${order}`, { signal });
export const getReplies = (id: number, signal?: AbortSignal) => request<Comment[]>(`/comments/${id}/replies/`, { signal });
export const createComment = (input: CommentInput, parent?: number) =>
  request<Comment>(parent ? `/comments/${parent}/replies/` : '/comments/create/', { method: 'POST', body: JSON.stringify(input) });
