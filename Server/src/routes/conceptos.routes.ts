import {Router} from 'express'
import { getConceptos } from '../controllers/conceptos.controllers';

const router = Router();

router.get('/', getConceptos)



export default router;