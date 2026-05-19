const jwt = require('jsonwebtoken');

// 1. Criando o Middleware de Autenticação
const authMiddleware = (req, res, next) => {
  // 2. Extraindo o cabeçalho de autorização (Authorization: Bearer <token>)
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  // 3. Separando o "Bearer" do Token real
  const [, token] = authHeader.split(' ');

  try {
    // 4. Verificando se o token é válido usando nosso JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_segredo_jwt_super_seguro_aqui');
    
    // 5. Anexando o ID do usuário (vindo do token decodificado) na requisição
    req.userId = decoded.id;
    
    // 6. Passando para o próximo controlador/rota
    return next();
  } catch (error) {
    // 7. Retornando erro se o token for inválido ou expirado
    return res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = authMiddleware;
