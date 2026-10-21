# Common Ground

React 19, strict TypeScript, Vite, CSS Modules, native Fetch and WebSocket, and DOMPurify. All frontend files live here; the Django backend is unchanged.

## Run

```sh
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Start the existing Django ASGI service and its PostgreSQL/Redis dependencies separately, using your existing backend workflow. Open the URL printed by Vite. No sample comments or simulated successful requests are included.

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

## Configuration and deployment

`VITE_API_URL` is the Django origin; `VITE_WS_URL` is the WebSocket origin. Vite development proxies `/backend/*` to Django and `/ws/*` to Channels, so the backend does not need CORS changes. CAPTCHA and uploaded media URLs also use this proxy in development.

For production, serve `dist/` from your frontend host and reverse-proxy `/comments/`, `/api/`, `/captcha/`, `/media/`, and `/ws/` to the existing backend. Leave both environment variables empty for this same-origin setup, and support WebSocket upgrades on `/ws/`. Alternatively, configure the two origins at build time; cross-origin HTTP requires CORS support at the deployment proxy because Django currently has none. HTTPS pages always use secure WebSockets. `vite preview` serves only the production bundle and does not provide the development proxy; it needs the production API/reverse-proxy arrangement. Never publish the Vite development server as a production server.

## Behavior

- Root comments use the actual 25-item DRF pagination, `sort=user_name|email|created_at`, and `order=asc|desc`. Sort and page are reflected in the URL. Default: newest first.
- Each reply level is fetched only after expansion. Logical reply depth is unlimited, while indentation stops increasing after five levels to keep content readable. Ancestor IDs guard against cycles.
- Guest and signed-in comments use the same CAPTCHA-protected creation endpoints. The HTML toolbar inserts the server's four supported tags. DOMPurify sanitizes all displayed HTML and previews. Form text is sent to the backend without silently rewriting it.
- CAPTCHA loads when the form mounts, refreshes every four minutes and after submission success/failure, and can be refreshed manually. Backend errors remain authoritative.
- JWT access and refresh tokens exist only in module memory. Registration uses the returned token pair. Access refresh is single-flight and retries a failed authorized request once. Reloading or closing the page ends the local session; there is no localStorage, sessionStorage, token URL, or invented cookie endpoint. Logout clears the local session even when blacklisting is unavailable; failures are shown.
- WebSocket events invalidate expanded reply lists and offer a refresh banner for root activity without reordering a conversation being read. Reconnection uses exponential backoff capped at 30 seconds plus jitter. Reconnecting invalidates expanded replies as well. Offline users can refresh manually; there is no polling.
- Uploads use multipart `file` after comment creation. A failed upload can be retried against the already-created comment or skipped without posting duplicates. Fetch provides an indeterminate uploading state. Images have local previews and uploaded images have an accessible dialog lightbox.

## Existing backend limitations

1. Replies return a complete, unpaginated array for one parent. The frontend cannot limit that server response. It fetches only explicitly expanded levels; it never traverses the complete tree automatically.
2. `CommentSerializer` contains no attachment metadata, and the attachment endpoint supports POST only. The frontend can display real attachment records returned by uploads made during this page session. Existing attachments cannot be discovered after reload or by other visitors. No attachment records or URLs are fabricated.
3. Images are resized server-side to fit 320×240; animated GIFs are rejected. TXT must be UTF-8 and at most 100 KiB. There is no documented server image byte-size cap, so the frontend does not invent one.
4. The backend parses text as XML before HTML sanitization. Tags must close correctly, literal ampersands must be `&amp;`, and link attribute ampersands must be escaped. The editor escapes inserted URL attributes; the form checks XML syntax and the server validates allowed HTML.
5. Emails are publicly returned in comment responses, including for anonymous users. The form discloses this rather than promising privacy.
6. There is no CAPTCHA expiry metadata. Four-minute refresh is precautionary; the backend decides whether a code is valid and a new code is fetched after validation failure.
7. JWTs are JSON-only. Persistent secure cookie sessions require backend changes and are intentionally unsupported.
8. Creation and attachment upload are separate requests, without transactions or idempotency keys across them. If a creation request times out after the server saves it, check the feed before retrying. The backend provides no supported way to resolve this ambiguity automatically.
9. No voting, editing, deletion, bookmarks, server search, or reply counts are exposed; none are fabricated.

## Organization

`app` composes providers and global styles; `pages` lays out the discussion board; `widgets` owns the header and feed/tree orchestration; `features` owns auth, composing, formatting, sorting, and pagination; `entities` contains backend models and entity display components; `shared` contains HTTP, configuration, sanitization, icons, and dialogs. Dependencies point down those layers. This single-page application does not need a routing dependency.

No screenshot attachment was available in the task context. Styling follows the requested light, restrained forum direction.

## Verification performed

Dependency installation, strict TypeScript checking, production bundling, and five DOMPurify/URL security tests passed. The final dependency installation reported zero known vulnerabilities. The Vite development server started successfully. Headless Chrome rendered the real application at 1440px desktop and 390px mobile viewport sizes, with no horizontal overflow. The server-unavailable state was visually inspected. Browser checks verified opening and closing the authentication dialog, switching to registration, and toggling the editor preview, with no uncaught JavaScript exceptions. No Django server was listening at `127.0.0.1:8000`, so successful live comments, CAPTCHA, uploads, JWT, and WebSocket exchanges could not be verified. Start the existing backend and exercise these paths before release. Browser rendering did not use seeded or simulated comments.
