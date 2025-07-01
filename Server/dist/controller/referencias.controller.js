"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarReferencia = exports.obtenerTodas = void 0;
const db_1 = __importDefault(require("../config/db"));
const generador_1 = require("../utils/generador");
const obtenerTodas = (_req, res) => {
    db_1.default.query('SELECT * FROM REFERENCIAS', (err, rows) => {
        if (err)
            return res.status(500).json({ error: err });
        res.json(rows);
    });
};
exports.obtenerTodas = obtenerTodas;
const generarReferencia = (req, res) => {
    const { alumno_id, concepto_id, periodo_id, referencia_base, importe, variable } = req.body;
    const fecha = new Date().toLocaleDateString('es-MX');
    const referenciaFinal = (0, generador_1.generarReferenciaPago)(referencia_base, fecha, importe, variable);
    const digito = referenciaFinal.slice(-2);
    const sql = `
    INSERT INTO REFERENCIAS (alumno_id, concepto_id, periodo_id, referencia_base, referencia_final, importe, digito_verificador)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db_1.default.query(sql, [alumno_id, concepto_id, periodo_id, referencia_base, referenciaFinal, importe, digito], (err) => {
        if (err)
            return res.status(500).json({ error: err });
        res.status(201).json({ mensaje: 'Referencia generada', referencia: referenciaFinal });
    });
};
exports.generarReferencia = generarReferencia;
