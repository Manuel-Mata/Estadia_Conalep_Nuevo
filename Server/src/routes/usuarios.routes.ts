// routes/usuarios.routes.ts
import { Router } from "express";
import { getUsuarios, login } from '../controllers/usuarios.controllers';

const router = Router();

router.get('/', getUsuarios);        // GET /api/usuarios/
router.post('/login', login);        // POST /api/usuarios/login

export default router;