import { SiteService } from './SiteService';
import { CacheService } from '../common/CacheService';
import { BrowserAccount } from './BrowserAccount';
import { SiteAccount } from './SiteAccount';

export class ModelHelper {
    static async init() {
        if (window.backgroundApi) {
            await SiteService.initDb();
            await CacheService.initDb();
            await BrowserAccount.initDb();
            await SiteAccount.initDb();
        }
    }
}
