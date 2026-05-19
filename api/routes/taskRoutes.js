const express = require('express');
const authMiddleware = require('../middlewares/auth');
const prisma = require('../prisma');

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Cria uma nova tarefa em um time
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               teamId:
 *                 type: string
 *               priority:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tarefa criada
 */
router.post('/', async (req, res) => {
  // 1. Recebendo os dados para criar a tarefa
  const { title, description, teamId, priority } = req.body;
  const userId = req.userId;

  try {
    // 2. Verificando se o usuário faz parte do time antes de deixar criar a tarefa
    const isMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: { userId, teamId }
      }
    });

    if (!isMember) {
      return res.status(403).json({ error: 'Você não faz parte deste time' });
    }

    // 3. Criando a tarefa
    const task = await prisma.task.create({
      data: {
        title,
        description,
        teamId,
        priority: priority || 'MEDIUM'
      }
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
});

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Lista todas as tarefas dos times do usuário
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tarefas
 */
router.get('/', async (req, res) => {
  const userId = req.userId;

  try {
    // 4. Buscando as tarefas apenas de times que o usuário é membro
    const tasks = await prisma.task.findMany({
      where: {
        team: {
          members: {
            some: { userId }
          }
        }
      },
      include: {
        team: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } }
      }
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   patch:
 *     summary: Atualiza status ou prioridade da tarefa
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               assigneeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tarefa atualizada
 */
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, assigneeId } = req.body;

  try {
    // 5. Atualizando campos parciais da tarefa
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(assigneeId && { assigneeId })
      }
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
});

module.exports = router;
