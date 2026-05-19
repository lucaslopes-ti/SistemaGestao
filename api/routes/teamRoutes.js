const express = require('express');
const authMiddleware = require('../middlewares/auth');
const prisma = require('../prisma');

const router = express.Router();

// 1. Aplicando o middleware de autenticação em todas as rotas de times
router.use(authMiddleware);

/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: Cria um novo time
 *     tags: [Times]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Time criado
 */
router.post('/', async (req, res) => {
  const { name } = req.body;
  const userId = req.userId; // Vem do authMiddleware

  try {
    // 2. Criando o time e já inserindo o dono como membro (ADMIN) numa única transação usando Prisma nested writes
    const team = await prisma.team.create({
      data: {
        name,
        ownerId: userId,
        members: {
          create: {
            userId: userId,
            role: 'ADMIN'
          }
        }
      },
      include: {
        members: true
      }
    });

    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar time' });
  }
});

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Lista os times do usuário logado
 *     tags: [Times]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de times
 */
router.get('/', async (req, res) => {
  const userId = req.userId;

  try {
    // 3. Buscando todos os times onde o usuário atual é membro
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, tasks: true } }
      }
    });

    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar times' });
  }
});

module.exports = router;
