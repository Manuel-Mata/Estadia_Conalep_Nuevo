import { Router } from "express";
import {actualizarAlumno, getAlumno, getAlumnos, obtenerAlumnoPorMatricula} from '../controllers/alumnos.controllers'

const router = Router();

//Método Get que permite encontrar a todos los alumnos
router.get('/', getAlumnos);
//Método get que permite encontrar un alumno mediante el id
router.get('/:id', getAlumno);
//Método get que se usa en el FrontEnd para activar los filtros 
router.get('/matricula/:matricula', obtenerAlumnoPorMatricula);
//Método put para actualizar los semestres de los alumnos
router.put('/actuzalizarSemestre', actualizarAlumno)


export default router;
