import { Router } from 'express';
import { 
  obtenerMateriasFiltradas,
  obtenerMateriasPorCarrera,
  obtenerMateriasTroncoComun,
  obtenerEstadisticasMaterias
} from '../controllers/materiascarreras.controllers';

const router = Router();

// 🎯 RUTA PRINCIPAL - Filtrar materias por carrera, período y semestre
// GET /api/materias_por_carreras/filtradas?carrera_id=1&periodo_id=1&semestre_id=1
router.get('/filtradas', obtenerMateriasFiltradas);

// 📊 RUTA - Todas las materias de una carrera
// GET /api/materias_por_carreras/carrera?carrera_id=1&periodo_id=1
router.get('/carrera', obtenerMateriasPorCarrera);

// 🌟 RUTA - Materias de tronco común por semestre
// GET /api/materias_por_carreras/tronco-comun?periodo_id=1&semestre_id=1
router.get('/tronco-comun', obtenerMateriasTroncoComun);

// 📋 RUTA - Estadísticas de materias por carrera
// GET /api/materias_por_carreras/estadisticas?periodo_id=1
router.get('/estadisticas', obtenerEstadisticasMaterias);

export default router;