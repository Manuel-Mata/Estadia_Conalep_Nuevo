import { Request, Response } from "express";
import connection from "../db/connection";

export const getCarreras = (req: Request, res: Response) => {
    connection.query('SELECT * FROM Carreras', (err, results) => {
        if (err) {
            console.error('Error al obtener carreras:', err);
            return res.status(500).json({
                msg: 'Error en la base de datos',
                error: err
            });
        }
        res.json({
            msg: 'Carreras obtenidas exitosamente',
            data: results
        });
    });
};

export const getCarrera = (req: Request, res: Response) => {
    const { id } = req.params;
    
    connection.query('SELECT * FROM Carreras WHERE id = ?', [id], (err, results: any) => {
        if (err) {
            console.error('Error al obtener carrera:', err);
            return res.status(500).json({
                msg: 'Error en la base de datos',
                error: err
            });
        }
        
        // Verificar si encontró la carrera
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

export const postCarrera = (req: Request, res: Response) => {
    const { nombre, descripcion } = req.body;
    
    // Validación básica
    if (!nombre) {
        return res.status(400).json({
            msg: 'El nombre de la carrera es requerido'
        });
    }
    
    connection.query(
        'INSERT INTO Carreras (nombre, descripcion) VALUES (?, ?)', 
        [nombre, descripcion], 
        (err, results: any) => {
            if (err) {
                console.error('Error al crear carrera:', err);
                return res.status(500).json({
                    msg: 'Error al crear la carrera',
                    error: err
                });
            }
            
            res.status(201).json({
                msg: 'Carrera creada exitosamente',
                id: results.insertId,
                data: { id: results.insertId, nombre, descripcion }
            });
        }
    );
};

export const putCarrera = (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    
    // Validación básica
    if (!nombre) {
        return res.status(400).json({
            msg: 'El nombre de la carrera es requerido'
        });
    }
    
    connection.query(
        'UPDATE Carreras SET nombre = ?, descripcion = ? WHERE id = ?',
        [nombre, descripcion, id],
        (err, results: any) => {
            if (err) {
                console.error('Error al actualizar carrera:', err);
                return res.status(500).json({
                    msg: 'Error al actualizar la carrera',
                    error: err
                });
            }
            
            // Verificar si se actualizó algún registro
            if (results.affectedRows === 0) {
                return res.status(404).json({
                    msg: 'Carrera no encontrada',
                    id: id
                });
            }
            
            res.json({
                msg: 'Carrera actualizada exitosamente',
                id: id,
                data: { id, nombre, descripcion }
            });
        }
    );
};

export const deleteCarrera = (req: Request, res: Response) => {
    const { id } = req.params;
    
    connection.query('DELETE FROM Carreras WHERE id = ?', [id], (err, results: any) => {
        if (err) {
            console.error('Error al eliminar carrera:', err);
            return res.status(500).json({
                msg: 'Error al eliminar la carrera',
                error: err
            });
        }
        
        // Verificar si se eliminó algún registro
        if (results.affectedRows === 0) {
            return res.status(404).json({
                msg: 'Carrera no encontrada',
                id: id
            });
        }
        
        res.json({
            msg: 'Carrera eliminada exitosamente',
            id: id
        });
    });
};

export const getCarreraPorAlumno = (req: Request, res: Response) => {
    const { matricula } = req.params;

    const sql = `
        SELECT c.*
        FROM Alumnos a
        JOIN Carreras c ON a.carrera_id = c.id
        WHERE a.matricula = ?
    `;

    connection.query(sql, [matricula], (err, results: any) => {
        if (err) {
            console.error('Error al obtener la carrera:', err);
            return res.status(500).json({ msg: 'Error en la base de datos', error: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ msg: 'Carrera no encontrada para la matrícula', matricula });
        }

        res.json({ data: results[0] });
    });
};
