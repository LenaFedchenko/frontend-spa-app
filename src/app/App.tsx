import { Component, type ReactNode } from 'react';
import { AuthProvider } from '../features/auth/AuthProvider';
import { CommentsPage } from '../pages/comments-page/CommentsPage';
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="fatal"><h1>Something interrupted the conversation.</h1><p>Reload the page to try again.</p><button className="primary" onClick={() => location.reload()}>Reload page</button></main>;
    return this.props.children;
  }
}
export function App() { return <ErrorBoundary><AuthProvider><CommentsPage /></AuthProvider></ErrorBoundary>; }
