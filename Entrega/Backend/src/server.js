import 'dotenv/config';
import app from './app.js';

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Backend rodando na porta ${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Rotas:  http://localhost:${port}/api/__routes`);
});