import { createHashRouter, Navigate, RouterProvider } from 'react-router';

import WebviewBrowser from '../pages/webview/WebviewBrowser';
import { GlobalProvider } from '../providers/GlobalProvider';
import { SiteService } from '../services/SiteService';
import { useEffectOnce } from '../hooks/hooks';
import { CacheService } from '../services/CacheService';

import AndroidDetail from '../pages/android/AndroidDetail';
import Android from '../pages/home/Android';
import Clients from '../pages/home/Clients';
import Home from '../pages/home/Home';
import Sites from '../pages/home/Sites';
import Setting from '../pages/home/Setting';

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
                element: <Navigate to="/clients" replace />
            },
            {
                path: 'clients',
                Component: Clients
            },
            {
                path: 'android',
                Component: Android
            },
            {
                path: 'sites',
                Component: Sites
            },
            {
                path: 'setting',
                Component: Setting
            }
        ]
    }
]);

const App = () => {
    useEffectOnce(() => {
        if (window.backgroundApi) {
            (async () => {
                await SiteService.initDb();
                await CacheService.initDb();
            })();
        }
    }, []);
    return (
        <GlobalProvider>
            <RouterProvider router={router} />
        </GlobalProvider>
    );
};
export { App };
