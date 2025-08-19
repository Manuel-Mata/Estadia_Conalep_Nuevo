import { Request, Response } from "express";
import connection from "../db/connection";

export const getSemestres = (req: Request, res: Response) => {
    connection.query('SELECT * FROM semestres', (err, results) => {
        if (err) {
            console.error('Error al obtener semestres:', err);
            return res.status(500).json({
                msg: 'Error en la base de datos',
                error: err
            });
        }
        res.json({
            msg: 'Semetres obtenidos exitosamente',
            data: results
        });
    });
};


export const getSemestre = (req: Request, res: Response) => {
    const { id } = req.params;
    
    connection.query('SELECT * FROM semestres WHERE id = ?', [id], (err, results: any) => {
        if (err) {
            console.error('Error al obtener el Semestre:', err);
            return res.status(500).json({
                msg: 'Error en la base de datos',
                error: err
            });
        }
        if (results.length === 0) {
            return res.status(404).json({
                msg: 'Semestre no encontrado',
                id: id
            });
        }
        res.json({
            data: results[0]
        });
    });
};
