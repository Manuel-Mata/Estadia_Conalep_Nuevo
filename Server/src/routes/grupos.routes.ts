import { Router } from "express";
import {getGrupo, getGrupos} from '../controllers/grupos.controllers'

const router = Router();
//Obtener todos los grupos
router.get('/', getGrupos);
router.get('/:id', getGrupo);


export default router;