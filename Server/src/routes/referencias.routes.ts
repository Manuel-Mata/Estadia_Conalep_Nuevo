import { Router } from 'express';
import { generarReferencia, obtenerTodas } from '../controller/referencias.controller';

const router = Router();

router.get('/', obtenerTodas);
router.post('/', generarReferencia);

export default router;
