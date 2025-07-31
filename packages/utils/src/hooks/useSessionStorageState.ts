import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export const getSessionStoredValue = (key: string, initialValue?: any) => {
    const storedValue = sessionStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue)[0] : initialValue;
};

export default function useSessionStorageState<S>(
    key: string,
    initialValue: S | (() => S)
): [S, Dispatch<SetStateAction<S>>] {
    const getStoredValue = (): S => {
        return getSessionStoredValue(key, initialValue);
    };
    const [state, setState] = useState<S>(getStoredValue);
    useEffect(() => {
        sessionStorage.setItem(key, JSON.stringify([state]));
    }, [key, state]);
    return [state, setState];
}
