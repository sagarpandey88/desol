import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ThemeToggle />
      </div>
      <h1>404</h1>
      <p>Page not found</p>
      <Link to="/dashboard" className="btn btn-primary">
        Back to Dashboard
      </Link>
    </div>
  );
}
