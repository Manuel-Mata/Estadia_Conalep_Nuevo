import {Request, Response} from 'express'
import connection from '../db/connection'

export const getPeriodos = (req: Request, res: Response) => {
    const query = 'SELECT * FROM Periodos';

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener periodos:', err);
            return res.status(500).json({
                msg: 'Error en la base de datos',
                error: err
            });
        }

        res.json(results);
    });
};

