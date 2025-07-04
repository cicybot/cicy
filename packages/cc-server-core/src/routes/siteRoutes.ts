import { Router } from 'express';
import { s3 } from '../db/Sqlite3';

const router = Router();

/**
 * @swagger
 * /site/add:
 *   post:
 *     summary: site add
 *     tags: [site]
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
 *               icon:
 *                 type: string
 *                 format: uri
 *                 example: ""
 *               title:
 *                 type: string
 *                 example: ""
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 */
router.post('/add', async (req, res) => {
    const db = s3();
    const { url, title, icon } = req.body;
    const updated_at = +new Date();
    const runResult = db
        .prepare('INSERT INTO site (url,title,icon,updated_at) VALUES (?,?,?,?)')
        .run(url, title || null, icon || null, updated_at);
    const id = runResult.lastInsertRowid;
    // const rows = db.prepare('SELECT * FROM mytable').all();
    res.json({
        result: { id }
    });
});

/**
 * @swagger
 * /site/update:
 *   put:
 *     summary: site update
 *     tags: [site]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 0
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.example.com"
 *               icon:
 *                 type: string
 *                 format: uri
 *                 example: ""
 *               title:
 *                 type: string
 *                 example: ""
 *               content:
 *                 type: string
 *                 example: ""
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 */
router.put('/update', async (req, res) => {
    const db = s3();
    const { id, url, title,content, icon } = req.body;
    const updated_at = +new Date();

    // Validate required fields
    if (!id) {
        res.status(400).json({
            err: 'ID is required'
        });
    } else {
        try {
            // Build dynamic update query based on provided fields
            const fieldsToUpdate = [];
            const values = [];

            if (url !== undefined) {
                fieldsToUpdate.push('url = ?');
                values.push(url);
            }

            if (title !== undefined) {
                fieldsToUpdate.push('title = ?');
                values.push(title || null);
            }

            if (icon !== undefined) {
                fieldsToUpdate.push('icon = ?');
                values.push(icon || null);
            }


            if (content !== undefined) {
                fieldsToUpdate.push('content = ?');
                values.push(content || null);
            }


            fieldsToUpdate.push('updated_at = ?');
            values.push(updated_at);

            values.push(id); // For WHERE clause

            if (fieldsToUpdate.length === 1) {
                // Only updated_at was added
                res.status(400).json({
                    err: 'No fields to update'
                });
            } else {
                const query = `UPDATE site SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
                const stmt = db.prepare(query);
                const result = stmt.run(...values);

                if (result.changes === 0) {
                    res.status(404).json({
                        err: 'Site not found'
                    });
                } else {
                    res.json({
                        result: {
                            id,
                            changes: result.changes
                        }
                    });
                }
            }
        } catch (error) {
            res.status(500).json({
                err: 'Failed to update site'
            });
        }
    }
});

/**
 * @swagger
 * /site/delete:
 *   delete:
 *     summary: site delete
 *     tags: [site]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
router.delete('/delete', async (req, res) => {
    const db = s3();
    const { id } = req.query;
    if (!id) {
        res.json({
            err:"id is null"
        });
    } else {
        const stmt = db.prepare('UPDATE site SET is_deleted = 1, updated_at = strftime("%s","now") WHERE id = ?');
        stmt.run(parseInt(id as string));
        res.json({
            result: {}
        });
    }
});
/**
 * @swagger
 * /site/get:
 *   get:
 *     summary: Get site by ID
 *     description: Retrieve a specific site by its ID
 *     tags: [site]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
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
router.get('/get', async (req, res) => {
    const db = s3();
    const { id } = req.query;

    // Validate ID
    if (!id || isNaN(Number(id))) {
        res.status(400).json({
            err: 'Valid ID is required'
        });
    } else {
        try {
            const stmt = db.prepare('SELECT * FROM site WHERE id = ?');
            const site = stmt.get(Number(id));

            if (!site) {
                res.status(404).json({
                    err: 'Site not found'
                });
            } else {
                res.json({
                    result: site
                });
            }
        } catch (error) {
            res.status(500).json({
                err: 'Failed to retrieve site'
            });
        }
    }
});

/**
 * @swagger
 * /site/list:
 *   get:
 *     summary: site list
 *     tags: [site]
 *     parameters:
 *       - in: query
 *         name: limit
 *         default: 10
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         default: 0
 *         schema:
 *           type: integer
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
router.get('/list', async (req, res) => {
    const db = s3();
    const { limit, offset } = req.query;
    const totalStmt = db.prepare('SELECT COUNT(*) as total FROM site');
    const { total } = totalStmt.get() as { total: number };
    const stmt = db.prepare(`
        SELECT id,title,url,icon,updated_at,is_deleted FROM site 
        order by updated_at desc LIMIT @limit OFFSET @offset
      `);

    const rows = stmt.all({
        limit: parseInt(limit as string) || 10,
        offset: parseInt(offset as string) || 0
    });

    res.json({
        result: {
            total,
            rows
        }
    });
});

/**
 * @swagger
 * /site/getSiteInfo:
 *   get:
 *     summary: getSiteInfo
 *     tags: [site]
 *     parameters:
 *       - in: query
 *         name: url
 *         default: http://www.baidu.com
 *         schema:
 *           type: string
 *           format: uri
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
router.get('/getSiteInfo', async (req, res) => {
    const { url } = req.query;
    try {
        const response = await fetch(url as string);
        if (response.ok) {
            const html = await response.text();
            const cheerio = require('cheerio');
            const $ = cheerio.load(html);
            const description = $('meta[name="description"]').attr('content');
            const title = $('title').text();
            const icons: any[] = [];
            let icon: string | null = null;
            $(
                'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]'
            ).each((i: any, el: any) => {
                const href = $(el).attr('href');
                if (href) {
                    if (!icon) {
                        icon = new URL(href, url as string).href;
                    }
                    icons.push({
                        type: $(el).attr('rel'),
                        href: new URL(href, url as string).href, // Convert to absolute URL
                        sizes: $(el).attr('sizes')
                    });
                }
            });
            if (icons.length === 0) {
                icon = new URL('/favicon.ico', url as string).href;
            }
            res.json({
                result: {
                    icons,
                    icon,
                    title,
                    description
                }
            });
        } else {
            throw Error('fetch site info error!');
        }
    } catch (e) {
        console.error(e);
        res.json({
            result: {
                icons: [],
                icon: '',
                title: '',
                description: ''
            }
        });
    }
});

/**
 * @swagger
 * /site/myIP:
 *   get:
 *     summary: myIP
 *     tags: [site]
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
router.get('/myIP', async (req, res) => {
    const { url } = req.query;
    try {
        const response = await fetch('http://myip.top/');
        if (response.ok) {
            const html = await response.text();
            const cheerio = require('cheerio');
            const $ = cheerio.load(html);
            const header = $('header').text();
            res.json({
                result: {
                    ipInfo: header
                        .trim()
                        .split('\n')
                        .map((row: string) => row.trim())
                }
            });
        } else {
            throw Error('fetch site info error!');
        }
    } catch (e) {
        console.error(e);
        res.json({
            result: {
                icons: [],
                icon: '',
                title: '',
                description: ''
            }
        });
    }
});

export default router;
