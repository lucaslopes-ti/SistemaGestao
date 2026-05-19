const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra um novo usuário
 *     tags: [Autenticação]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 */
router.post('/register', async (req, res) => {
  // 1. Recebendo os dados do body
  const { name, email, password } = req.body;

  try {
    // 2. Verificando se o email já existe
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    // 3. Gerando o hash da senha (criptografia)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Salvando no banco de dados
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autentica o usuário e retorna o token JWT
 *     tags: [Autenticação]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login bem sucedido, retorna o token
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Buscando o usuário pelo email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // 2. Comparando a senha enviada com o hash salvo no banco
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // 3. Gerando o token JWT (expira em 1 dia)
    const secret = process.env.JWT_SECRET || 'seu_segredo_jwt_super_seguro_aqui';
    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '1d' });

    // 4. Retornando os dados do usuário com o token
    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

module.exports = router;
