import { Request, Response } from 'express';
import db from '../config/db';
import { generarReferenciaPago } from '../utils/generador';

export const obtenerTodas = (_req: Request, res: Response) => {
  db.query('SELECT * FROM REFERENCIAS', (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows);
  });
};

export const generarReferencia = (req: Request, res: Response) => {
  const { alumno_id, concepto_id, periodo_id, referencia_base, importe, variable } = req.body;
  const fecha = new Date().toLocaleDateString('es-MX');
  const referenciaFinal = generarReferenciaPago(referencia_base, fecha, importe, variable);
  const digito = referenciaFinal.slice(-2);

  const sql = `
    INSERT INTO REFERENCIAS (alumno_id, concepto_id, periodo_id, referencia_base, referencia_final, importe, digito_verificador)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql, [alumno_id, concepto_id, periodo_id, referencia_base, referenciaFinal, importe, digito], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ mensaje: 'Referencia generada', referencia: referenciaFinal });
  });
};
