import { Router } from "express";
import {getSemestres, getSemestre} from '../controllers/semestres.controllores'

const router = Router();
router.get('/', getSemestres);
router.get('/:id', getSemestre);



export default router;
