const express = require('express');
const authMiddleware = require('../middlewares/auth');
const prisma = require('../prisma');

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/tasks/{taskId}/comments:
 *   post:
 *     summary: Adiciona um comentário em uma tarefa
 *     tags: [Comentários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
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
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comentário criado
 */
router.post('/tasks/:taskId/comments', async (req, res) => {
  const { taskId } = req.params;
  const { content } = req.body;
  const userId = req.userId;

  try {
    // 1. Verificando se a tarefa existe
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });

    // 2. Criando o comentário linkando a tarefa e o autor (usuário logado)
    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        authorId: userId
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar comentário' });
  }
});

/**
 * @swagger
 * /api/tasks/{taskId}/comments:
 *   get:
 *     summary: Lista os comentários de uma tarefa
 *     tags: [Comentários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de comentários
 */
router.get('/tasks/:taskId/comments', async (req, res) => {
  const { taskId } = req.params;

  try {
    // 3. Buscando os comentários e incluindo os dados do autor (nome)
    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        author: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' } // Comentários mais recentes primeiro
    });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar comentários' });
  }
});

module.exports = router;
