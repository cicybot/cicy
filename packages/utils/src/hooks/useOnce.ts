import { useEffect } from 'react';

export function useOnce(effect: () => void | (() => void)): void {
  useEffect(() => {
    const cleanup = effect();
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, []);
}

export default useOnce;