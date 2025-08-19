import { Request, Response } from "express";
import connection from "../db/connection";



export const getMaterias = (req: Request, res: Response) => {
    connection.query('SELECT * FROM Materias', (err, results) => {
        if (err) {
            console.error('Error al obtener materias', err);
            return res.status(500).json({
                msg: 'Error en la base de datos',
                error: err
            });
        }
        res.json({
            msg: 'Materias obtenidas exitosamente',
            data: results
        });
    });
};


export const getMateria = (req: Request, res: Response) => {
    const { id } = req.params;
    
    connection.query('SELECT * FROM Materias WHERE id = ?', [id], (err, results: any) => {
        if (err) {
            console.error('Error al obtener Materia:', err);
            return res.status(500).json({
                msg: 'Error en la base de datos',
                error: err
            });
        }
        if (results.length === 0) {
            return res.status(404).json({
                msg: 'Materia no encontrada',
                id: id
            });
        }
        res.json({
            data: results[0]
        });
    });
};

export const deleteMateria = (req: Request, res: Response) => {
    const { id } = req.params;
    
    connection.query('DELETE FROM Materias WHERE id = ?', [id], (err, results: any) => {
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

export const postMateria = (req: Request, res: Response) => {
    const { nombre, descripcion } = req.body;
    
    // Validación básica
    if (!nombre) {
        return res.status(400).json({
            msg: 'El nombre de la carrera es requerido'
        });
    }
    
    connection.query(
        'INSERT INTO Materias (nombre, descripcion) VALUES (?, ?)', 
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

export const putMateria = (req:Request , res:Response) => {
    const { body } = req;
    const { id } = req.params;
    res.json({
        msg:"Put Materia",
        body : body,
        id : id

    });
};


export const obtenerMateriasPorSemestre = async (req: Request, res: Response) => {
  try {
    const { semestre_id } = req.params;
    
    // ✅ PROMISIFICAR la query para usar async/await
    const query = 'SELECT id, nombre, siglas, semestre_id, carrera_id FROM materias WHERE semestre_id = ? ORDER BY nombre ASC';
    
    const results = await new Promise((resolve, reject) => {
      connection.query(query, [semestre_id], (error, results) => {
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