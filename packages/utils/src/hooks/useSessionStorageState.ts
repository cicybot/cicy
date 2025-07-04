import { Dispatch, SetStateAction, useEffect, useState } from 'react';


// function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];

export default function useSessionStorageState<S>(
    key: string,
    initialValue:  S | (() => S)
): [S, Dispatch<SetStateAction<S>>] {
    const getStoredValue = (): S => {
        const storedValue = sessionStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue)[0] : initialValue;
    };
    const [state, setState] = useState<S>(getStoredValue);
    useEffect(() => {
        sessionStorage.setItem(key, JSON.stringify([state]));
    }, [key, state]);
    return [state, setState];
}
