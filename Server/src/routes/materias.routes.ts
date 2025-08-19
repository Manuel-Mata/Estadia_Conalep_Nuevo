import { Router } from "express";
import { deleteMateria, getMateria, getMaterias, obtenerMateriasPorSemestre, postMateria, putMateria } from "../controllers/materias.controllers";


const router = Router();

router.get('/', getMaterias);
router.get('/:id', getMateria);
router.delete('/:id', deleteMateria);
router.post('/', postMateria);
router.put('/:id', putMateria)

//TEMPORAL
router.get('/semestre/:semestre_id', obtenerMateriasPorSemestre);

export default router;