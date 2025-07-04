import { Router } from 'express';
import { LeidianService } from '../services/LeidianService';

const router = Router();

/**
 * @swagger
 * /ld/client:
 *   post:
 *     summary: leidian client actions
 *     tags: [leidian]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
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
router.post('/client', async (req, res, next) => {
    const service = new LeidianService();
    const { action,payload } = req.body as { action: string,payload:any };

    try {
        res.status(200).json(
            await service.sendSync(
                {
                    action,
                    payload
                },
                30000
            )
        );
    } catch (e) {
        res.status(500).json({ err: (e as Error).message });
    }
});




export default router;
