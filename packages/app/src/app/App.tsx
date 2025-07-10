import { createHashRouter, Navigate, RouterProvider } from 'react-router';

import WebviewBrowser from '../pages/webview/WebviewBrowser';
import { GlobalProvider } from '../providers/GlobalProvider';
import { useEffectOnce } from '../hooks/hooks';

import AndroidDetail from '../pages/android/AndroidDetail';
import Android from '../pages/home/Android';
import Clients from '../pages/home/Clients';
import Home from '../pages/home/Home';
import Sites from '../pages/home/Sites';
import Setting from '../pages/home/Setting';
import BrowserAccounts from '../pages/home/BrowserAccounts';
import Proxy from '../pages/home/Proxy';
import { ModelHelper } from '../services/model/ModelHelper';

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
                path: 'proxy',
                Component: Proxy
            },
            {
                path: 'browserAccounts',
                Component: BrowserAccounts
            },
            {
                path: 'setting',
                Component: Setting
            }
        ]
    }
]);
async function init() {
    ModelHelper.init().catch(console.error);
}
const App = () => {
    useEffectOnce(() => {
        init().catch(console.error);
    }, []);
    return (
        <GlobalProvider>
            <RouterProvider router={router} />
        </GlobalProvider>
    );
};
export { App };
