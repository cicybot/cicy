import { ReactNode, useEffect, useRef, useState } from 'react';
import { handleProps, ViewProps } from '.';

interface ViewWithSizeProps extends ViewProps {
    children: ReactNode;
    onChangeSize?: (size: { width: number; height: number }) => void;
}

export function ViewWithSize({ onChangeSize, children, ...props }: ViewWithSizeProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    useEffect(() => {
        if (!ref.current) return;
        const element = ref.current;
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                setSize({ width, height });
                onChangeSize && onChangeSize({ width, height });
            }
        });

        resizeObserver.observe(element);

        return () => {
            resizeObserver.unobserve(element);
            resizeObserver.disconnect();
        };
    }, []);

    const { empty, hide, ...props_ } = props;
    if (hide) {
        return null;
    }
    if (empty) {
        return <>{children}</>;
    }

    return (
        <div ref={ref} {...handleProps(props_)}>
            {size.height === 0 || size.width === 0 ? null : children}
        </div>
    );
}
