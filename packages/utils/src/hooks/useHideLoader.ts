import { useEffect } from 'react';

function useHideLoader() {
    useEffect(() => {
        const loading = document.querySelector('#__loading');
        //@ts-ignore
        document.body.style.appRegion = 'unset';
        //@ts-ignore
        if (loading) loading.style.display = 'none';
    }, []);
}

export default useHideLoader;
