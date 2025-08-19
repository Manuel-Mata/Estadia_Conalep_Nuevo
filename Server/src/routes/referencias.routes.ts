import {Router} from "express"
import {getReferencia, getReferencias, generarReferencia, getAlumnoPorMatricula, getConceptos, getCarreras, getPeriodos,getSemestres, getMateriasFiltradas, getReferenciasAlumno} from '../controllers/referencias.controllers'

const router = Router();

router.get('/', getReferencias);

// Obtener una referencia específica
router.get('/:id', getReferencia);

// Generar nueva referencia (ENDPOINT PRINCIPAL)
router.post('/generar', generarReferencia);

// ===== RUTAS PARA EL PORTAL (datos necesarios para los selects) =====

// Obtener alumno por matrícula
router.get('/alumnos/matricula/:matricula', getAlumnoPorMatricula);

// Obtener todos los conceptos
router.get('/datos/conceptos', getConceptos);

// Obtener todas las carreras  
router.get('/datos/carreras', getCarreras);

// Obtener todos los períodos
router.get('/datos/periodos', getPeriodos);

// Obtener todos los semestres
router.get('/datos/semestres', getSemestres);

// Obtener materias filtradas (para asesorías complementarias)
router.get('/datos/materias/filtradas', getMateriasFiltradas);

// Obtener referencias de un alumno específico
router.get('/alumno/:alumnoId', getReferenciasAlumno);

export default router;