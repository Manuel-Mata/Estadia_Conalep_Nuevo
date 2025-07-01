"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const referencias_controller_1 = require("../controller/referencias.controller");
const router = (0, express_1.Router)();
router.get('/', referencias_controller_1.obtenerTodas);
router.post('/', referencias_controller_1.generarReferencia);
exports.default = router;
