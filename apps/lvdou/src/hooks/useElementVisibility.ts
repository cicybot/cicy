import { RefObject, useEffect, useRef, useState } from 'react';

interface UseElementVisibilityReturn {
    ref: RefObject<HTMLSpanElement>;
    isVisible: boolean;
}

export const useElementVisibility = (
    options: IntersectionObserverInit = {}
): UseElementVisibilityReturn => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.1, ...options }
        );

        const currentElement = ref.current;
        if (currentElement) {
            observer.observe(currentElement);
        }

        return () => {
            if (currentElement) {
                observer.unobserve(currentElement);
            }
        };
    }, [options]);

    return { ref, isVisible };
};
