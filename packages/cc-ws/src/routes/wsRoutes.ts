import { Router } from 'express';
import { getLocalIPAddress } from '../utils';
import { CCServerWebSocket } from '../CCServerWebSocket';

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
    const {adr} = getLocalIPAddress() || {}
    res.json({
        result: {
            ip: adr,
            clients:CCServerWebSocket.getClientIds()
        }
    });
});


/**
 * @swagger
 * /ws/sendMsg:
 *   post:
 *     summary: WsClients
 *     description: |
 *       ## Send Msg
 *       
 *       This endpoint allows sending messages to specific WebSocket clients connected to the server.
 *       
 *       ### CC Agent Master:
 * 
 *       ### CC Agent App:
 * 
 *       ```json
 *       {
 *         "clientId": "ADR-Redmi-2409BRN2CC-2",
 *         "action": "jsonrpc",
 *         "payload": {
 *           "method": "deviceInfo"
 *         }
 *       }
 *       ```
 * 
 * 
 *       ```json
 *       {
 *         "clientId": "ADR-Redmi-2409BRN2CC-2",
 *         "action": "jsonrpc",
 *         "payload": {
 *           "method": "deviceInfo",
 *           "params": [
 *             "Important update!",
 *             "Please check your inbox"
 *           ]
 *         }
 *       }
 *       ```
 * 
 * 
 * 
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
 *                   type: object
 *                   properties:
 *                     method:
 *                       type: string
 *                     params:
 *                       type: array
 *                       items:
 *                         type: string
 *              
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                 err:
 *                   type: string
 */
router.post('/sendMsg', async (req, res) => {
    const { clientId, action,payload } = req.body as {
        clientId:string,
        action:string,
        payload?:{
            method:string,
            params:any[]
        }
    };
    let body:{err?:any,result?:any} = {err:"NOT FOUND WINDOW ID"};
    if (CCServerWebSocket.hasClient(clientId)) {
        const result = await CCServerWebSocket.send(
            clientId,
            {
                action,
                payload
            },
            30000
        );
        body = {result}
    }
    res.json(body);
});



export default router;
