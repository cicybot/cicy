import { createHashRouter, Navigate, RouterProvider } from 'react-router';
import AndroidDetail from '../pages/android/AndroidDetail';
import Android from '../pages/home/Android';
import Clients from '../pages/home/Clients';
import Home from '../pages/home/Home';

import Sites from '../pages/home/Sites';

import WebviewBrowser from '../pages/webview/WebviewBrowser';
import { GlobalProvider } from '../providers/GlobalProvider';
import { useEffect, useRef } from 'react';
import { SiteService } from '../services/SiteService';
import { useEffectOnce } from '../hooks/hooks';
import { CacheService } from '../services/CacheService';

const router = createHashRouter([
    {
        path: '/android/detail/:clientId',
        Component: AndroidDetail
    },
    {
        path: '/browser',
        Component: WebviewBrowser
    },
    {
        path: '/',
        Component: Home,
        children: [
            {
                index: true,
                element: <Navigate to="/android" replace />
            },
            {
                path: 'android',
                Component: Android
            },
            {
                path: 'clients',
                Component: Clients
            },
            {
                path: 'sites',
                Component: Sites
            }
        ]
    }
]);

const App = () => {
    useEffectOnce(() => {
        (async () => {
            SiteService.initDb();
            CacheService.initDb();
        })();
    }, []);
    return (
        <GlobalProvider>
            <RouterProvider router={router} />
        </GlobalProvider>
    );
};
export { App };
