import { Router } from "express";
import { getUsuarios,login } from '../controllers/usuarios.controllers'

const router = Router();
router.get('/', getUsuarios)
router.post('/login', login)


export default router;