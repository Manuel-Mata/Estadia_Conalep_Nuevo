import { Router } from 'express';
import { getCarreras, getCarrera, postCarrera, putCarrera, deleteCarrera } from '../controllers/carreras.controllers';
import { obtenerAlumnoPorMatricula } from '../controllers/alumnos.controllers';

const router = Router();

//Obtener todas las carreras
router.get('/', getCarreras);
//Obtener una carrera específica
router.get('/:id', getCarrera);
//Crear una nueva carrera
router.post('/', postCarrera);
//Actualizar una carrera
router.put('/:id', putCarrera);
//Eliminar una carrera
router.delete('/:id', deleteCarrera);
//Obtener Alumno por carrea
router.get('/alumno/:matricula', obtenerAlumnoPorMatricula);


export default router;