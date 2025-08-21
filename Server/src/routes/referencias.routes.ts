import { Router } from 'express';
import { 
  obtenerTodas, 
  guardarReferencia, 
  obtenerReferenciasPorAlumno,
  validarReferencia,
  generarReferencia 
} from '../controllers/referencias.controller';

const router = Router();

// ✅ RUTAS PRINCIPALES
router.get('/', obtenerTodas);                                    // GET /api/referencias
router.post('/', guardarReferencia);                             // POST /api/referencias ← ESTA ES LA QUE NECESITAS
router.get('/alumno/:alumno_id', obtenerReferenciasPorAlumno);   // GET /api/referencias/alumno/123
router.get('/validar/:referencia', validarReferencia);           // GET /api/referencias/validar/20252716...

// ✅ RUTA LEGACY (mantener compatibilidad)
router.post('/generar', generarReferencia);                      // POST /api/referencias/generar

export default router;