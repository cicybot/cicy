import { CCWSClient } from './CCWSClient';
import { SiteService } from '../model/SiteService';

export class MainClientMessageHandler {
    static async handleMsg(message: string) {
        const { action, id, from: fromClientId, payload } = JSON.parse(message);
        let res: any = { err: '' };
        switch (action) {
            case 'site': {
                const { method, params } = payload;
                switch (method) {
                    case 'getWebContentsId': {
                        const { windowId } = params || {};
                        const [accountIndex, siteId] = windowId.split('-');
                        const account = await new SiteService(
                            siteId,
                            accountIndex
                        ).getAccountState();
                        res = {
                            webContentsId: account?.webContentsId
                        };
                        break;
                    }
                    default:
                        break;
                }
                break;
            }
            default:
                if (window.backgroundApi) {
                    res = await window.backgroundApi.message({ action, payload });
                }
                break;
        }
        if (id && fromClientId) {
            new CCWSClient(fromClientId).sendWithoutResult({
                id,
                action: 'callback',
                payload: res
            });
        }
    }
}
