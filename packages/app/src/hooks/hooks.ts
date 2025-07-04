import { useRef, useEffect } from "react";

export const useEffectOnce = (f: () => any, args: any[]) => {
    const run = useRef(false);
    useEffect(() => {
        if (run.current) {
            return;
        }
        run.current = true;
        f();
    }, args);
};