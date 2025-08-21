// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// ✅ COMENTA todas las importaciones de rutas:
 import usuariosRoutes from './routes/usuarios.routes';
 import alumnosRoutes from './routes/alumnos.routes';
 import referenciasRoutes from './routes/referencias.routes';
 import gruposRoutes from './routes/grupos.routes';
 import carrerasRoutes from './routes/carreras.routes';
 import conceptosRoutes from './routes/conceptos.routes';
 import materiasRoutes from './routes/materias.routes';
 import periodosRoutes from './routes/periodos.routes';
 import semestresRoutes from './routes/semestres.routes';
 import materiascarrerasRoutes from './routes/materiascarreras.routes';

console.log('🔥 INICIANDO servidor desde src/server.ts');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ COMENTA todas las rutas:
 app.use('/api/usuarios', usuariosRoutes);
 app.use('/api/alumnos', alumnosRoutes);
 app.use('/api/referencias', referenciasRoutes);
 app.use('/api/grupos', gruposRoutes);
 app.use('/api/carreras', carrerasRoutes);
 app.use('/api/conceptos', conceptosRoutes);
 app.use('/api/materias', materiasRoutes);
 app.use('/api/periodos', periodosRoutes);
 app.use('/api/semestres', semestresRoutes);
 app.use('/api/materiascarreras', materiascarrerasRoutes); 

// Ruta básica
app.get('/', (req, res) => {
    res.json({ 
        message: '🚀 Servidor funcionando sin rutas!',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
});