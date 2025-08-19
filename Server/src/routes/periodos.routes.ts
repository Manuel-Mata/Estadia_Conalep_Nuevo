import {Router} from 'express'
import { getPeriodos } from '../controllers/referencias.controllers';

const router =  Router();
router.get('/', getPeriodos)

export default router;