import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Automatically scrolls to top on every route change
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, search]);

  return null;
}
