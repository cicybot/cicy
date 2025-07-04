import { useEffect, useRef } from 'react';

function useInterval(callback: () => void, delay: number = 1000) {
    const savedCallback = useRef<() => void>();
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        function tick() {
            savedCallback.current?.();
        }
        let id = setTimeout(function loop() {
            tick();
            id = setTimeout(loop, delay); // Recursively set timeout
        }, delay);

        return () => clearTimeout(id);
    }, [delay]);
}

export default useInterval;
