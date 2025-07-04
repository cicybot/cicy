import { Router } from 'express';
import os from 'os';
import { WsClientsService } from '../services/WsClientsService';

function getLocalExternalIP(): string | null {
  const interfaces = os.networkInterfaces();

  for (const name in interfaces) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }

  return null;
}

const router = Router();


/**
 * @swagger
 * /ws/info:
 *   get:
 *     summary: WsClients
 *     tags: [WsClients]
 *     responses:
 *       200:
 *         description: ip
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 */
router.get('/info', async (req, res) => {
    let info = {}
    if (WsClientsService.hasClient('ElectronMainWindow')) {
        const res = await new WsClientsService('ElectronMainWindow').sendSync({
            action: 'info'
        });
        if(!res.err){
            info = res.result
        }
    }
    res.json({
        result: {
            ip: getLocalExternalIP(),
            ...info
        }
    });
});



/**
 * @swagger
 * /ws/clients:
 *   get:
 *     summary: WsClients
 *     tags: [WsClients]
 *     responses:
 *       200:
 *         description: WsClients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 */
router.get('/clients', async (req, res) => {
    const clients = WsClientsService.getClientIds();
    res.json({
        result: {
            clients: clients
        }
    });
});


/**
 * @swagger
 * /ws/sendMsg:
 *   post:
 *     summary: WsClients
 *     tags: [WsClients]
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


/**
 * @swagger
 * /ws/proxy:
 *   post:
 *     summary: WsClients
 *     tags: [WsClients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payload:
 *                 type: object
 *               url:
 *                 type: string
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
router.post('/proxy', async (req, res) => {
    const { url,payload } = req.body as {
        url:string,
        payload:any
    };
    const body = await fetch(url,{
        method:"post",
        body:JSON.stringify(payload),
        headers:{
            "Content-Type":"application/json"
        }
    })
    const json = await body.json()
    res.json(json);
});



export default router;
