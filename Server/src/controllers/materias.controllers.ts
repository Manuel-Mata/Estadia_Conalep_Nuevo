import { Request, Response } from "express";
import connection from "../db/connection";
import { RowDataPacket, ResultSetHeader } from 'mysql2'; // ✅ Agregué importación

export const getMaterias = (req: Request, res: Response): void => { // ✅ Agregué : void
    connection.query('SELECT * FROM Materias', (err, results: RowDataPacket[]) => { // ✅ Agregué tipo
        if (err) {
            console.error('Error al obtener materias', err);
            res.status(500).json({ // ✅ Quité return
                msg: 'Error en la base de datos',
                error: err
            });
            return; // ✅ Solo return
        }
        res.json({
            msg: 'Materias obtenidas exitosamente',
            data: results
        });
    });
};

export const getMateria = (req: Request, res: Response): void => { // ✅ Agregué : void
    const { id } = req.params;
    
    connection.query('SELECT * FROM Materias WHERE id = ?', [id], (err, results: RowDataPacket[]) => { // ✅ Cambié any por RowDataPacket[]
        if (err) {
            console.error('Error al obtener Materia:', err);
            res.status(500).json({ // ✅ Quité return
                msg: 'Error en la base de datos',
                error: err
            });
            return; // ✅ Solo return
        }
        if (results.length === 0) {
            res.status(404).json({ // ✅ Quité return
                msg: 'Materia no encontrada',
                id: id
            });
            return; // ✅ Solo return
        }
        res.json({
            data: results[0]
        });
    });
};

export const deleteMateria = (req: Request, res: Response): void => { // ✅ Agregué : void
    const { id } = req.params;
    
    connection.query('DELETE FROM Materias WHERE id = ?', [id], (err, results: ResultSetHeader) => { // ✅ Cambié any por ResultSetHeader
        if (err) {
            console.error('Error al eliminar materia:', err); // ✅ Cambié "carrera" por "materia"
            res.status(500).json({ // ✅ Quité return
                msg: 'Error al eliminar la materia', // ✅ Cambié "carrera" por "materia"
                error: err
            });
            return; // ✅ Solo return
        }
        
        // Verificar si se eliminó algún registro
        if (results.affectedRows === 0) {
            res.status(404).json({ // ✅ Quité return
                msg: 'Materia no encontrada', // ✅ Cambié "carrera" por "materia"
                id: id
            });
            return; // ✅ Solo return
        }
        
        res.json({
            msg: 'Materia eliminada exitosamente', // ✅ Cambié "carrera" por "materia"
            id: id
        });
    });
};

export const postMateria = (req: Request, res: Response): void => { // ✅ Ya tenías : void, perfecto!
    const { nombre, descripcion } = req.body;
    
    if (!nombre || !descripcion) {
        res.status(400).json({ // ✅ Quité return
            msg: 'Nombre y descripción son requeridos'
        });
        return; // ✅ Solo return
    }
    
    connection.query(
        'INSERT INTO Materias (nombre, descripcion) VALUES (?, ?)', 
        [nombre, descripcion], 
        (err, results: ResultSetHeader) => { // ✅ Cambié any por ResultSetHeader
            if (err) {
                console.error('Error al crear materia:', err); // ✅ Cambié "carrera" por "materia"
                res.status(500).json({ // ✅ Quité return
                    msg: 'Error al crear la materia', // ✅ Cambié "carrera" por "materia"
                    error: err
                });
                return; // ✅ Solo return
            }
            
            res.status(201).json({
                msg: 'Materia creada exitosamente', // ✅ Cambié "carrera" por "materia"
                id: results.insertId,
                data: { id: results.insertId, nombre, descripcion }
            });
        }
    );
};

export const putMateria = (req: Request, res: Response): void => { // ✅ Agregué : void
    const { body } = req;
    const { id } = req.params;
    res.json({
        msg: "Put Materia",
        body: body,
        id: id
    });
};

export const obtenerMateriasPorSemestre = async (req: Request, res: Response): Promise<void> => { // ✅ Agregué : Promise<void>
    try {
        const { semestre_id } = req.params;
        
        // ✅ PROMISIFICAR la query para usar async/await
        const query = 'SELECT id, nombre, siglas, semestre_id, carrera_id FROM materias WHERE semestre_id = ? ORDER BY nombre ASC';
        
        const results = await new Promise<RowDataPacket[]>((resolve, reject) => { // ✅ Agregué tipo
            connection.query(query, [semestre_id], (error, results: RowDataPacket[]) => { // ✅ Agregué tipo
                if (error) reject(error);
                else resolve(results);
            });
        });

        res.status(200).json({
            success: true,
            msg: 'Materias obtenidas exitosamente',
            data: results
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            msg: 'Error interno del servidor'
        });
    }
};