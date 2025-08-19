import {Request, Response} from 'express'
import connection from '../db/connection'

export const getConceptos = (req: Request, res: Response) => {
    connection.query('SELECT * FROM conceptos', (err, results) => {
        if (err) {
            console.error('Error al obtener conceptos:', err);
            return res.status(500).json({
                msg: 'Error en la base de datos',
                error: err
            });
        }
        res.json({
            success: true,
            conceptos: results || []  // Cambia 'referencias' a 'data' para ser consistente
        });
    });
};  