import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import referenciasRoutes from './routes/referencias.routes';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/referencias', referenciasRoutes);

app.get('/', (_req, res) => {
  res.send('API de Referencias está corriendo ✅');
});


app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
