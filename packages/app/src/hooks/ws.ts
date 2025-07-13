import { CCWSClient } from '../services/cicy/CCWSClient';
import { SiteInfo, SiteService } from '../services/model/SiteService';
import { useEffect, useState } from 'react';
import { onEvent } from '../utils/utils';
import { BrowserAccount, BrowserAccountInfo } from '../services/model/BrowserAccount';

export const useBrowserAccounts = () => {
    const [rows, setRows] = useState<BrowserAccountInfo[]>([]);
    const getRows = async () => {
        return BrowserAccount.getAccounts().then(res => {
            try {
                if (res.length === 0) {
                    BrowserAccount.add({}, 5);
                }
                setRows(res);
            } catch (error) {
                setRows([]);
            }
        });
    };
    useEffect(() => {
        getRows().catch(console.error);
        const reloadBrowserAccounts = () => getRows();
        window.addEventListener('reloadBrowserAccounts', reloadBrowserAccounts);
        return () => {
            window.removeEventListener('reloadBrowserAccounts', reloadBrowserAccounts);
        };
    }, []);
    return {
        rows,
        refresh: async () => {
            await getRows();
        }
    };
};

export const useWsClients = () => {
    const [clients, setData] = useState([]);
    const getData = async () => {
        return new CCWSClient('').getClients().then(res => {
            try {
                setData(r => {
                    if (!res) {
                        return [];
                    }
                    if (JSON.stringify(r) === JSON.stringify(res.clients)) {
                        return r;
                    }
                    return res.clients;
                });
            } catch (error) {
                setData([]);
            }
        });
    };
    useEffect(() => {
        getData();
    }, []);
    return {
        clients,
        refetch: async (noLoading?: boolean) => {
            if (!noLoading) {
                onEvent('showLoading');
            }
            await getData();
        }
    };
};

export const useSites = () => {
    const [sites, setData] = useState<SiteInfo[]>([]);
    const getData = async () => {
        return SiteService.getAllSite().then(res => {
            try {
                setData(res.map(row => row) || []);
            } catch (e) {
                console.error('site map error:', e, '[res]:', res);
            }
        });
    };
    useEffect(() => {
        getData();
    }, []);
    return {
        sites,
        refetch: () => {
            onEvent('showLoading');
            getData().finally(() => onEvent('hideLoading'));
        }
    };
};
