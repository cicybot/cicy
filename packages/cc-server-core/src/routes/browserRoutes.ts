import { Router } from 'express';
import { s3 } from '../db/Sqlite3';
import { WsClientsService } from '../services/WsClientsService';
const router = Router();

/**
 * @swagger
 * /browser/BaseWindow/createWindow:
 *   post:
 *     summary: createWindow
 *     tags: [browser]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - windowId
 *               - url
 *             properties:
 *               windowId:
 *                 type: string
 *                 example: 1-1
 *               noWebview:
 *                 type: boolean
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.example.com"
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                 error:
 *                   type: string
 */
router.post('/BaseWindow/createWindow', async (req, res) => {
    const { windowId, url,noWebview } = req.body as {
        windowId: string;
        noWebview:string;
        url: string;
    };

    if (WsClientsService.hasClient('ElectronMainWindow')) {
        new WsClientsService('ElectronMainWindow').createWindow({
            windowId,
            url,
            noWebview:noWebview === "true"
        });
        res.json({
            result:windowId
        });
    } else {
          res.json({
            err:'NOT FOUND WINDOW ID',
            result:windowId
        });
    }
});

/**
 * @swagger
 * /browser/info:
 *   get:
 *     summary: info
 *     tags: [browser]
 *     parameters:
 *       - in: query
 *         name: windowId
 *         required: true
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                 error:
 *                   type: string
 * 
 */
router.get('/info', async (req, res) => {
    const { windowId } = req.query as {
        windowId: string;
    };
   
    res.json({
        err: '',
        result:new WsClientsService(windowId).getInfo()
    });
});

/**
 * @swagger
 * /browser/info:
 *   post:
 *     summary: info
 *     tags: [browser]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - windowId
 *               - webContentsId
 *               - info
 *             properties:
 *               windowId:
 *                 type: string
 *               info:
 *                 type: object
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                 error:
 *                   type: string
 */
router.post('/info', async (req, res) => {
    const { windowId,info,webContentsId } = req.body as {
        windowId: string;info:any,webContentsId:number
    };
    if(info.title !== undefined && WsClientsService.hasClient('ElectronMainWindow')){
        await new WsClientsService('ElectronMainWindow').sendSync({
            action: 'callBaseWindow',
            payload: {
                method: 'setTitle',
                params: { 
                    title:info.title
                 },
                windowId,
                webContentsId
            }
        });
    }

    if( info.title || info.favIcon){
        const t = windowId.split("-")
        const siteId = parseInt(t[1])
        const db = s3();
        const stmt = db.prepare('SELECT title,id,icon FROM site WHERE id = ?');
        const site = stmt.get(siteId) as {title:string,icon:string,id:number} | null;
        if(site && !site.title && info.title){
            const updatedAt = +new Date();
            db
                .prepare('update site set title = ?,updated_at = ? where id = ?')
                .run(info.title, updatedAt,site.id);
        }
        if(site && !site.icon && info.favIcon){
            const updatedAt = +new Date();
            db
                .prepare('update site set icon = ?,updated_at = ? where id = ?')
                .run(info.favIcon, updatedAt,site.id);
        }
    }

    new WsClientsService(windowId).setInfo(webContentsId,info)
    const info1 = new WsClientsService(windowId).getInfo()
    
    // const query = `
    // INSERT INTO site_account (site_id, account_id, info, updated_at)
    // VALUES (?, ?, ?, ?)
    // ON CONFLICT(site_id, account_id)
    // DO UPDATE SET
    //     info = excluded.info,
    //     updated_at = excluded.updated_at
    // `;
    // const db = s3();
    // const stmt = db.prepare(query);
    // stmt.run(siteId, accountId, JSON.stringify(info1), Date.now());

    res.json({
        err: '',
        result:info1
    });
});

/**
 * @swagger
 * /browser/open:
 *   post:
 *     summary: open
 *     tags: [browser]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.example.com"
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                 error:
 *                   type: string
 */
router.post('/open', async (req, res) => {
    const { url,accountIndex } = req.body as {
        url: string;accountIndex:string
    };
    const account_index = accountIndex ? parseInt(accountIndex):0;
    const db = s3();
    const stmt = db.prepare('SELECT * FROM site WHERE url = ?');
    const site = stmt.get(url) as {id:number} | null;
    let siteId;
    if(!site){
        const updatedAt = +new Date();
        const runResult = db
            .prepare('INSERT INTO site (url,updated_at) VALUES (?,?)')
            .run(url, updatedAt);
        siteId = runResult.lastInsertRowid;
    }else{
        siteId = site.id
    }

    const windowId = `${account_index}-${siteId}`
    if (WsClientsService.hasClient('ElectronMainWindow')) {
        new WsClientsService('ElectronMainWindow').createWindow({
            windowId,
            url,
        });
        res.json({
            result:{windowId}
        });
    } else {
        res.json({
            err: 'NOT FOUND WINDOW ID',
            result:{windowId}
        });
    }
});

/**
 * @swagger
 * /browser/BaseWindow:
 *   post:
 *     summary: BaseWindow
 *     tags: [browser]
 *     requestBody:
 *       description: Call BaseWindow [API guide](https://www.electronjs.org/zh/docs/latest/api/base-window)
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - windowId
 *               - method
 *               - params
 *             properties:
 *               windowId:
 *                 type: string
 *                 example: "0-1"
 *               method:
 *                 type: string
 *               params:
 *                 type: object
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                 error:
 *                   type: string
 */
router.post('/BaseWindow', async (req, res) => {
    const { windowId,params, method } = req.body as { windowId: string; method: string,params:any };
    let body:{err?:any,result?:any} = {err:"NOT FOUND WINDOW ID"};
    if (WsClientsService.hasClient('ElectronMainWindow')) {
        body = await new WsClientsService('ElectronMainWindow').sendSync({
            action: 'callBaseWindow',
            payload: {
                method,
                params,
                windowId
            }
        });
    }
    res.json(body);
});


/**
 * @swagger
 * /browser/WebContents:
 *   post:
 *     summary: WebContents
 *     tags: [browser]
 *     requestBody:
 *       description: Call WebContents [API guide](https://www.electronjs.org/zh/docs/latest/api/webview-tag)
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - windowId
 *               - method
 *               - params
 *             properties:
 *               windowId:
 *                 type: string
 *                 example: "0-1"
 *               action:
 *                 type: string
 *               params:
 *                 type: object
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                 error:
 *                   type: string
 */
router.post('/WebContents', async (req, res) => {
    const { windowId,params, method } = req.body as { windowId: string; method: string,params:any };
    let body:{err?:any,result?:any} = {err:"NOT FOUND WINDOW ID"};
    if (WsClientsService.hasWebContentsId(windowId)) {
        const webContentsId = WsClientsService.getWebContentsId(windowId)
        body = await new WsClientsService('ElectronMainWindow').sendSync(
            {
                action: 'callWebContents',
                payload: {
                    method,
                    params,
                    windowId,
                    webContentsId
                }
            },
            30000
        );
    }
    res.json(body);
});

/**
 * @swagger
 * /browser/WebContents/sendClickEvent:
 *   post:
 *     summary: sendClickEvent
 *     tags: [browser]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - windowId
 *               - x
 *               - y
 *             properties:
 *               windowId:
 *                 type: string
 *                 example: "0-1"
 *               x:
 *                 type: integer
 *               y:
 *                 type: integer
 *               delay:
 *                 type: integer
 *               showPoint:
 *                 type: integer
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                 error:
 *                   type: string
 */
router.post('/WebContents/sendClickEvent', async (req, res) => {
    const { windowId, x,y,delay,showPoint } = req.body as { windowId: string; x: string,y:string,delay:string,showPoint:string };
    let body:{err?:any,result?:any} = {err:"NOT FOUND WINDOW ID"};
    if (WsClientsService.hasWebContentsId(windowId)) {
        const webContentsId = WsClientsService.getWebContentsId(windowId)
        body = await new WsClientsService('ElectronMainWindow').sendSync({
            action: 'callWebContents',
            payload: {
                method: 'sendClickEvent',
                params: { 
                    x:parseInt(x),
                    y:parseInt(y),
                    delay:delay ? parseInt(delay): 0,
                    showPoint:showPoint === 'true'
                 },
                windowId,
                webContentsId
            }
        });
    }
    res.json(body);
});

/**
 * @swagger
 * /browser/WebContents:
 *   post:
 *     summary: WebContents
 *     tags: [browser]
 *     requestBody:
 *       description: Call WebContents [API guide](https://www.electronjs.org/zh/docs/latest/api/webview-tag)
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - windowId
 *               - method
 *               - params
 *             properties:
 *               windowId:
 *                 type: string
 *                 example: "0-1"
 *               method:
 *                 type: string
 *               params:
 *                 type: object
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                 error:
 *                   type: string
 */
router.post('/WebContents', async (req, res) => {
    const { windowId,params, method } = req.body as { windowId: string; method: string,params:any };
    let body:{err?:any,result?:any} = {err:"NOT FOUND WINDOW ID"};
    if (WsClientsService.hasWebContentsId(windowId)) {
        const webContentsId = WsClientsService.getWebContentsId(windowId)
        body = await new WsClientsService('ElectronMainWindow').sendSync(
            {
                action: 'callWebContents',
                payload: {
                    method,
                    params,
                    windowId,
                    webContentsId
                }
            },
            30000
        );
    }
    res.json(body);
});

/**
 * @swagger
 * /browser/WebContents/id:
 *   post:
 *     summary: getId
 *     tags: [browser]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - windowId
 *             properties:
 *               windowId:
 *                 type: string
 *                 example: "0-1"
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                 error:
 *                   type: string
 */
router.post('/WebContents/id', async (req, res) => {
    const { windowId } = req.body as { windowId: string; };
    let body:{err?:any,result?:any} = {err:"NOT FOUND WINDOW ID"};
    if (WsClientsService.hasWebContentsId(windowId)) {
        const webContentsId = WsClientsService.getWebContentsId(windowId)
        body = {
            result:{webContentsId:webContentsId || 0}
        }
    }
    res.json(body);
});
/**
 * @swagger
 * /browser/sendMsg:
 *   post:
 *     summary: WsClients
 *     tags: [browser]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *             properties:
 *               clientId:
 *                 type: string
 *               action:
 *                 type: string
 *               payload:
 *                 type: object
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                 error:
 *                   type: string
 */
router.post('/sendMsg', async (req, res) => {
    const { clientId, action,payload } = req.body as {
        clientId:string,
        action:string,
        payload:any
    };
    let body:{err?:any,result?:any} = {err:"NOT FOUND WINDOW ID"};
    if (WsClientsService.hasClient(clientId)) {
        body = await new WsClientsService(clientId).sendSync(
            {
                action,
                payload
            },
            30000
        );
    }

    res.json(body);
});

export default router;
