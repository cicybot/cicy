import { useEffect, useRef } from 'react';

function useTimeoutLoop(callback: () => Promise<void>, delay: number = 1000) {
    const savedCallback = useRef<() => Promise<void>>();

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);
    useEffect(() => {
        let isCancelled = false;

        async function tick() {
            if (savedCallback.current && !isCancelled) {
                await savedCallback.current();
            }
        }

        // If the delay is null, don't set the timeout.
        if (delay === null) return;

        // Setup recursive timeout loop
        async function loop() {
            await tick();
            if (!isCancelled) {
                setTimeout(loop, delay); // Recursively call setTimeout after async callback finishes
            }
        }

        const id = setTimeout(loop, delay);

        // Cleanup the timeout on component unmount or if delay changes.
        return () => {
            isCancelled = true;
            clearTimeout(id);
        };
    }, [delay]);
}

export default useTimeoutLoop;
