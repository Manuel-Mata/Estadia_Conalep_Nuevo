import { Request, Response } from "express";
import connection from "../db/connection";
import { RowDataPacket, ResultSetHeader } from 'mysql2'; // ✅ Agregué ResultSetHeader
// import { error } from "console"; // ✅ Eliminé esta línea innecesaria

export const getAlumnos = (req: Request, res: Response): void => { // ✅ Agregué : void
    connection.query('SELECT * FROM alumnos', (err, results: RowDataPacket[]) => { // ✅ Agregué tipo
        if (err) {
            console.error('Error al obtener alumnos:', err);
            res.status(500).json({ // ✅ Quité return
                msg: 'Error en la base de datos',
                error: err
            });
            return; // ✅ Solo return
        }
        res.json({
            msg: 'Alumnos obtenidos exitosamente',
            data: results
        });
    });
};

export const getAlumno = (req: Request, res: Response): void => { // ✅ Agregué : void
    const { id } = req.params;
    
    connection.query('SELECT * FROM alumnos WHERE id = ?', [id], (err, results: RowDataPacket[]) => { // ✅ Cambié any por RowDataPacket[]
        if (err) {
            console.error('Error al obtener carrera:', err);
            res.status(500).json({ // ✅ Quité return
                msg: 'Error en la base de datos',
                error: err
            });
            return; // ✅ Solo return
        }
        
        // Verificar si encontró la carrera
        if (results.length === 0) { // ✅ Ahora funciona
            res.status(404).json({ // ✅ Quité return
                msg: 'Carrera no encontrada',
                id: id
            });
            return; // ✅ Solo return
        }
        
        res.json({
            data: results[0] // ✅ Ahora funciona
        });
    });
};

export const obtenerAlumnoPorMatricula = (req: Request, res: Response): void => { // ✅ Agregué : void
    const { matricula } = req.params;

    connection.query('SELECT * FROM Alumnos WHERE matricula = ?', [matricula], (err, results: RowDataPacket[]) => { // ✅ Agregué tipo
        if (err) {
            console.error('Error al buscar alumno:', err);
            res.status(500).json({ msg: 'Error en la base de datos' }); // ✅ Quité return
            return; // ✅ Solo return
        }

        if (results.length === 0) { // ✅ Ahora funciona
            res.status(404).json({ msg: 'Alumno no encontrado' }); // ✅ Quité return
            return; // ✅ Solo return
        }

        res.json(results[0]); // ✅ Ahora funciona
    });
};

export const actualizarAlumno = (req: Request, res: Response): void => { // ✅ Agregué : void
    const { alumno_id, nuevo_semestre_id } = req.body;

    connection.query('UPDATE alumnos SET semestre_id = ? WHERE id = ?', [nuevo_semestre_id, alumno_id], (err, results: ResultSetHeader) => { // ✅ ResultSetHeader para UPDATE
        if (err) {
            console.log('Ocurrio un error al buscar al alumno:', err);
            res.status(500).json({ msg: 'Ocurrio un error en la BD' }); // ✅ Quité return
            return; // ✅ Solo return
        }

        if (results.affectedRows === 0) { // ✅ Para UPDATE usa affectedRows en lugar de length
            res.status(400).json({ msg: 'Alumno no encontrado' }); // ✅ Quité return
            return; // ✅ Solo return
        }
        
        res.json({ 
            msg: 'Alumno actualizado exitosamente',
            affectedRows: results.affectedRows 
        }); // ✅ Para UPDATE no hay results[0]
    });
};