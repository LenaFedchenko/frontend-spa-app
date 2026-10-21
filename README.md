# Common Ground — Frontend

**A modern, responsive discussion interface built with React, TypeScript, and Vite.**

Common Ground is a real-time discussion platform where visitors can create comments, share opinions, reply to other users, and follow conversations.

The frontend was developed as part of the **dZENcode technical assessment** and integrates with a Django REST Framework backend.

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React |
| Language | TypeScript |
| Build tool | Vite |
| Architecture | Feature-Sliced Design |
| Styling | CSS Modules |
| HTTP communication | Fetch API |
| Real-time communication | WebSocket API |
| Containerization | Docker |
| Web server | Nginx |

## Features

### Discussion Feed

- Display comments and nested replies
- Sort discussions by date, username, or email
- Ascending and descending sorting
- Paginated discussions
- Display loading indicators and error messages
- Refresh comments when new activity is detected

### Comment Editor

- Create comments without registration
- Write replies to existing comments
- Format text using supported HTML tags
- Insert links
- Preview formatted content
- Validate inputs before submission

### Authentication

- User registration
- Login and logout
- JWT-based authentication
- Automatic access-token refresh
- Authenticated user information in the interface

### CAPTCHA

- CAPTCHA image display
- CAPTCHA answer validation
- Refresh CAPTCHA challenge
- Display validation errors

### File Attachments

Supported formats:

- JPG
- PNG
- GIF
- TXT

Users can attach files to their comments. Images and text files are displayed with appropriate previews or download links.

### Real-Time Updates

The application connects to the Django backend using WebSockets.

When another user creates a comment, the frontend receives an event and updates the relevant discussion state.

The connection includes automatic reconnection and protection against processing duplicate events.

### Responsive Interface

The application is styled with CSS Modules and supports desktop and mobile screen sizes.

---

## Project Structure

The application follows Feature-Sliced Design principles.

```text
frontend/
├── src/
│   ├── app/
│   ├── pages/
│   │   └── comments-page/
│   ├── widgets/
│   ├── features/
│   │   ├── auth/
│   │   ├── comment-editor/
│   │   ├── comment-sorting/
│   │   ├── comment-pagination/
│   │   └── create-comment/
│   ├── entities/
│   │   ├── comment/
│   │   └── attachment/
│   └── shared/
│       ├── api/
│       ├── config/
│       ├── lib/
│       └── ui/
├── index.html
├── package.json
├── vite.config.ts
├── Dockerfile
├── nginx.conf
└── README.md
```

### Architecture

**App** — application-level configuration and initialization.

**Pages** — page composition and layout.

**Widgets** — larger interface components, such as the header and discussion feed.

**Features** — user interactions, including authentication, comment creation, sorting, and pagination.

**Entities** — domain models and UI components for comments and attachments.

**Shared** — reusable API utilities, configuration, helpers, and UI elements.

This separation helps keep the application modular and maintainable.

---

## Getting Started

### Prerequisites

- Node.js
- npm
- Running backend API

### 1. Clone the repository

```bash
git clone <FRONTEND_REPOSITORY_URL>
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the backend URL

Create `.env` if needed:

```env
VITE_API_URL=http://127.0.0.1:8000
```

The development server uses a proxy to communicate with the Django backend.

### 4. Start the development server

```bash
npm run dev
```

Open:

http://localhost:5173

---

## Running with Docker

The full project is designed to run through the backend's Docker Compose configuration.

Expected directory structure:

```text
project/
├── spa-test/
└── frontend/
```

Navigate to the backend directory:

```bash
cd ../spa-test
```

Start all services:

```bash
docker compose up -d --build
```

Apply database migrations:

```bash
docker compose exec backend python manage.py migrate
```

Open the frontend:

**http://localhost:8080**

In Docker, Nginx serves the compiled React application and proxies API and WebSocket requests to Django.

---

## API Integration

The frontend communicates with the Django REST API using a shared HTTP client.

### Main API Operations

| Operation | Endpoint |
|---|---|
| Get comments | `GET /comments/` |
| Create comment | `POST /comments/create/` |
| Get replies | `GET /comments/{id}/replies/` |
| Create reply | `POST /comments/{id}/replies/` |
| Upload attachment | `POST /comments/{id}/attachments/` |
| Get CAPTCHA | `GET /api/captcha/` |
| Register | `POST /api/auth/register/` |
| Login | `POST /api/auth/login/` |
| Refresh token | `POST /api/auth/refresh/` |
| Logout | `POST /api/auth/logout/` |

During development, the Vite proxy forwards requests from `/backend` to the Django API.

In Docker, Nginx handles the proxy:

```text
Browser
   |
   v
React + Nginx
   |
   +---- /backend/* ---> Django REST API
   |
   +---- /ws/* -------> Django Channels
```

### Authentication Handling

The shared HTTP client attaches JWT access tokens to authenticated requests.

If an access token expires, the client can attempt a refresh and retry the request.

If refresh fails, the session is cleared.

---

## Real-Time Communication

WebSocket endpoint:

```text
ws://localhost:8080/ws/comments/
```

The frontend listens for the `comment.created` event.

When an event arrives, the relevant part of the comment feed is marked for refresh.

The WebSocket hook handles:

- Connection status
- Automatic reconnection
- Duplicate event filtering
- Batched update notifications
- Connection cleanup

---

## Build

Create a production bundle:

```bash
npm run build
```

Vite generates the compiled application inside the `dist` directory.

The Docker frontend image uses a multi-stage build:

1. Node.js installs dependencies and builds React.
2. Nginx serves the generated static files.
3. Nginx proxies backend and WebSocket requests.

---

## Interface Design

The UI uses a minimal discussion-focused design with:

- Light background
- Neutral cards and borders
- Blue interactive accents
- Responsive layouts
- Clear typography
- Loading and validation feedback

CSS Modules keep component styles isolated and reduce naming conflicts.

---

## Error Handling

The frontend handles:

- Network errors
- API validation errors
- Failed authentication requests
- Invalid CAPTCHA input
- Unsupported attachments
- Failed comment or reply creation
- Temporary WebSocket disconnections

The interface displays relevant error messages and retry actions.

---

## Backend Repository

The React application requires the Common Ground Django backend.

Backend technologies include Django REST Framework, PostgreSQL, Redis, Celery, Daphne, and Django Channels.

See the backend repository for API implementation details, automated tests, database configuration, and Docker Compose instructions.

---

## Development Notes

This frontend demonstrates practical experience with React, TypeScript, component-based architecture, API integration, JWT authentication, WebSockets, responsive UI development, validation, and Docker.

**Developed for the dZENcode technical assessment.**