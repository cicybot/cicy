import { Router } from 'express';
import { WsClientsService } from '../services/WsClientsService';
const router = Router();

/**
 * @swagger
 * /android/adb:
 *   post:
 *     summary: adb utils
 *     tags: [android]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method
 *             properties:
 *               clientId:
 *                 type: string
 *               method:
 *                 type: string
 *               params:
 *                 type: array
 *                 items:
 *                   type: string
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
router.post('/adb', async (req, res) => {
    const { method,params,clientId } = req.body as {
        method:string,
        params:any,
        clientId:string
    };
    let body:{err?:any,result?:any} = {err:"NOT FOUND CLIENT ID"};
    if (WsClientsService.hasClient(clientId||"ADR_ELECTRON_CLIENT")) {
        body = await new WsClientsService(clientId||"ADR_ELECTRON_CLIENT").sendSync(
            {
                action:"adbAndroid",
                payload:{
                    method,
                    params
                }
            },
            30000
        );
    }

    res.json(body);
});


export default router;
