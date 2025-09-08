import { PageNav, useGlobalContext } from '../providers/GlobalProvider';
import { useEffect } from 'react';

export const useAuthLogin = () => {
    const { state, dispatch } = useGlobalContext();
    useEffect(() => {
        if (!state.authUser) {
            dispatch({
                type: 'UPDATE_STATE',
                payload: {
                    currentPage: PageNav.Login
                }
            });
        }
    }, []);
};
