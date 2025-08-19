import { Request, Response } from "express";
import connection from "../db/connection";
import { error } from "console";

export const getAlumnos = (req: Request, res: Response) => {
    connection.query('SELECT * FROM alumnos', (err, results) => {
        if (err) {
            console.error('Error al obtener alumnos:', err);
            return res.status(500).json({
                msg: 'Error en la base de datos',
                error: err
            });
        }
        res.json({
            msg: 'Alumnos obtenidos exitosamente',
            data: results
        });
    });
};


export const getAlumno = (req: Request, res: Response) => {
    const { id } = req.params;
    
    connection.query('SELECT * FROM alumnos WHERE id = ?', [id], (err, results: any) => {
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

export const obtenerAlumnoPorMatricula = (req: Request, res: Response) => {
    const { matricula } = req.params;

    connection.query('SELECT * FROM Alumnos WHERE matricula = ?', [matricula], (err, results) => {
        if (err) {
            console.error('Error al buscar alumno:', err);
            return res.status(500).json({ msg: 'Error en la base de datos' });
        }

        if (results.length === 0) {
            return res.status(404).json({ msg: 'Alumno no encontrado' });
        }

        res.json(results[0]);
    });
};

export const actualizarAlumno = (req: Request, res:Response) => {
    const {alumno_id, nuevo_semestre_id} = req.body;

    connection.query('UPDATE alumnos SET semestre_id = ? WHERE id = ?',[nuevo_semestre_id, alumno_id], (err, results) =>{
        if (err) {
            console.log('Ocurrio un error al buscar al alumno:', err);
            return res.status(500).json({msg:'Ocurrio un error en la BD'});
        }

        if (results.length === 0){
            return res.status(400).json({msg:'Alumno no encontrado'});
        }
        res.json(results[0]);
    }) 

}
