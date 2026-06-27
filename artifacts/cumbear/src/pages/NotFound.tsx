import { Link } from 'wouter';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cumbear-black flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-cumbear-red/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-10 h-10 text-cumbear-red" />
        </div>
        <h1 className="text-4xl font-black text-white mb-2">404</h1>
        <p className="text-cumbear-text-muted text-sm mb-6">Page not found</p>
        <Link href="/">
          <a className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-cumbear-red text-white text-sm font-medium hover:bg-cumbear-red-hover transition-colors">
            <Home className="w-4 h-4" />
            Back to Home
          </a>
        </Link>
      </div>
    </div>
  );
}

