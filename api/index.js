const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Importando as rotas
const authRoutes = require('./routes/authRoutes');
const teamRoutes = require('./routes/teamRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');

// 1. Inicializando o App Express
const app = express();

// 2. Configurando Middlewares Globais
app.use(cors()); // Permite requisições de outros domínios
app.use(express.json()); // Permite receber dados no formato JSON

// 3. Configuração do Swagger para Documentação
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema de Gestão de Tarefas API',
      version: '1.0.0',
      description: 'API REST do Task Manager estilo Trello com Times',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./api/routes/*.js'], // Onde o Swagger vai ler a documentação
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// 4. Definindo a rota da Documentação Interativa
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 5. Registrando as rotas da aplicação
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api', commentRoutes); // Como a rota é /api/tasks/:id/comments, definimos base como /api

// 6. Rota raiz / status
app.get('/', (req, res) => {
  res.json({ message: 'API do Task Manager rodando com sucesso!' });
});

// 7. Exportando para que a Vercel Serverless Function possa usar
module.exports = app;

// Se não estiver rodando na Vercel (ex: ambiente de desenvolvimento local via node)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando localmente na porta ${PORT}`);
    console.log(`Documentação disponível em http://localhost:${PORT}/api/docs`);
  });
}
