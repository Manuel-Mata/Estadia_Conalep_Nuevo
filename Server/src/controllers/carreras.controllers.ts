import { Request, Response } from "express";
import connection from "../db/connection";
import { RowDataPacket, ResultSetHeader } from 'mysql2'; // ✅ Agregué tipos

export const getCarreras = (req: Request, res: Response): void => { // ✅ Agregué : void
    connection.query('SELECT * FROM Carreras', (err, results: RowDataPacket[]) => { // ✅ Agregué tipo
        if (err) {
            console.error('Error al obtener carreras:', err);
            res.status(500).json({ // ✅ Quité return
                msg: 'Error en la base de datos',
                error: err
            });
            return; // ✅ Solo return
        }
        res.json({
            msg: 'Carreras obtenidas exitosamente',
            data: results
        });
    });
};

export const getCarrera = (req: Request, res: Response): void => { // ✅ Agregué : void
    const { id } = req.params;
    
    connection.query('SELECT * FROM Carreras WHERE id = ?', [id], (err, results: RowDataPacket[]) => { // ✅ Cambié any por RowDataPacket[]
        if (err) {
            console.error('Error al obtener carrera:', err);
            res.status(500).json({ // ✅ Quité return
                msg: 'Error en la base de datos',
                error: err
            });
            return; // ✅ Solo return
        }
        
        // Verificar si encontró la carrera
        if (results.length === 0) {
            res.status(404).json({ // ✅ Quité return
                msg: 'Carrera no encontrada',
                id: id
            });
            return; // ✅ Solo return
        }
        
        res.json({
            data: results[0] 
        });
    });
};

export const postCarrera = (req: Request, res: Response): void => { // ✅ Agregué : void
    const { nombre, descripcion } = req.body;
    
    // Validación básica
    if (!nombre) {
        res.status(400).json({ // ✅ Quité return
            msg: 'El nombre de la carrera es requerido'
        });
        return; // ✅ Solo return
    }
    
    connection.query(
        'INSERT INTO Carreras (nombre, descripcion) VALUES (?, ?)', 
        [nombre, descripcion], 
        (err, results: ResultSetHeader) => { // ✅ Cambié any por ResultSetHeader
            if (err) {
                console.error('Error al crear carrera:', err);
                res.status(500).json({ // ✅ Quité return
                    msg: 'Error al crear la carrera',
                    error: err
                });
                return; // ✅ Solo return
            }
            
            res.status(201).json({
                msg: 'Carrera creada exitosamente',
                id: results.insertId,
                data: { id: results.insertId, nombre, descripcion }
            });
        }
    );
};

export const putCarrera = (req: Request, res: Response): void => { // ✅ Ya tenías : void, perfecto!
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    
    // Validación básica
    if (!nombre) {
        res.status(400).json({ // ✅ Quité return
            msg: 'El nombre de la carrera es requerido'
        });
        return; // ✅ Solo return
    }
    
    connection.query(
        'UPDATE Carreras SET nombre = ?, descripcion = ? WHERE id = ?',
        [nombre, descripcion, id],
        (err, results: ResultSetHeader) => { // ✅ Cambié any por ResultSetHeader
            if (err) {
                console.error('Error al actualizar carrera:', err);
                res.status(500).json({ // ✅ Quité return
                    msg: 'Error al actualizar la carrera',
                    error: err
                });
                return; // ✅ Solo return
            }
            
            // Verificar si se actualizó algún registro
            if (results.affectedRows === 0) {
                res.status(404).json({ // ✅ Quité return
                    msg: 'Carrera no encontrada',
                    id: id
                });
                return; // ✅ Solo return
            }
            
            res.json({
                msg: 'Carrera actualizada exitosamente',
                id: id,
                data: { id, nombre, descripcion }
            });
        }
    );
};

export const deleteCarrera = (req: Request, res: Response): void => { // ✅ Agregué : void
    const { id } = req.params;
    
    connection.query('DELETE FROM Carreras WHERE id = ?', [id], (err, results: ResultSetHeader) => { // ✅ Cambié any por ResultSetHeader
        if (err) {
            console.error('Error al eliminar carrera:', err);
            res.status(500).json({ // ✅ Quité return
                msg: 'Error al eliminar la carrera',
                error: err
            });
            return; // ✅ Solo return
        }
        
        // Verificar si se eliminó algún registro
        if (results.affectedRows === 0) {
            res.status(404).json({ // ✅ Quité return
                msg: 'Carrera no encontrada',
                id: id
            });
            return; // ✅ Solo return
        }
        
        res.json({
            msg: 'Carrera eliminada exitosamente',
            id: id
        });
    });
};

export const getCarreraPorAlumno = (req: Request, res: Response): void => { // ✅ Agregué : void
    const { matricula } = req.params;

    const sql = `
        SELECT c.*
        FROM Alumnos a
        JOIN Carreras c ON a.carrera_id = c.id
        WHERE a.matricula = ?
    `;

    connection.query(sql, [matricula], (err, results: RowDataPacket[]) => { // ✅ Cambié any por RowDataPacket[]
        if (err) {
            console.error('Error al obtener la carrera:', err);
            res.status(500).json({ msg: 'Error en la base de datos', error: err }); // ✅ Quité return
            return; // ✅ Solo return
        }

        if (results.length === 0) {
            res.status(404).json({ msg: 'Carrera no encontrada para la matrícula', matricula }); // ✅ Quité return
            return; // ✅ Solo return
        }

        res.json({ data: results[0] });
    });
};