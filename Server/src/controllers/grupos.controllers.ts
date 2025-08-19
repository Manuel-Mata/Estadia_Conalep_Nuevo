import { Request, Response } from "express";
import connection from "../db/connection";

export const getGrupos = (req: Request, res: Response) => {
    connection.query('SELECT * FROM Grupos', (err, results) => {
        if (err) {
            console.error('Error al obtener grupos:', err);
            return res.status(500).json({
                msg: 'Error en la base de datos',
                error: err
            });
        }
        res.json({
            msg: 'Grupos obtenidos exitosamente',
            data: results
        });
    });
};



export const getGrupo = (req: Request, res: Response) => {
    const { id } = req.params;
    
    connection.query('SELECT * FROM Grupos WHERE id = ?', [id], (err, results: any) => {
        if (err) {
            console.error('Error al obtener carrera:', err);
            return res.status(500).json({
                msg: 'Error en la base de datos',
                error: err
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({
                msg: 'Carrera no encontrada',
                id: id
            });
        }  
        res.json({
            data: results[0] 
        });
    });
};