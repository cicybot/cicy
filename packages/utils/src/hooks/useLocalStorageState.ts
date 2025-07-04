import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export default function useLocalStorageState<S>(
    key: string,
    initialValue: S
): [S, Dispatch<SetStateAction<S>>] {
    const getStoredValue = (): S => {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue)[0] : initialValue;
    };
    const [state, setState] = useState<S>(getStoredValue);
    useEffect(() => {
        localStorage.setItem(key, JSON.stringify([state]));
    }, [key, state]);
    return [state, setState];
}
