import { Request, Response } from 'express';
import connection from '../db/connection';
import { RowDataPacket } from 'mysql2'; 

export const obtenerMateriasFiltradas = async (req: Request, res: Response): Promise<void> => { // ✅ Agregué : Promise<void>
  try {
    
    const { carrera_id, periodo_id, semestre_id } = req.query;
    
    
    if (!carrera_id || !periodo_id || !semestre_id) {
      res.status(400).json({ // ✅ Quité return
        success: false,
        msg: 'Se requieren carrera_id, periodo_id y semestre_id'
      });
      return; // ✅ Solo return
    }

    // Validar que sean números válidos
    if (isNaN(Number(carrera_id)) || isNaN(Number(periodo_id)) || isNaN(Number(semestre_id))) {
      res.status(400).json({ // ✅ Quité return
        success: false,
        msg: 'Los parámetros deben ser números válidos'
      });
      return; // ✅ Solo return
    }

    console.log('🔍 Filtrando materias con:', { carrera_id, periodo_id, semestre_id });

    // 🗄️ CONSULTA SQL CON JOIN
    const query = `
      SELECT 
        m.id,
        m.nombre,
        m.siglas,
        m.semestre_id,
        s.numero as semestre_numero,
        c.nombre as carrera_nombre,
        c.siglas as carrera_siglas
      FROM materias m
      INNER JOIN materiascarreras mpc ON m.id = mpc.materia_id
      INNER JOIN carreras c ON mpc.carrera_id = c.id
      INNER JOIN semestres s ON m.semestre_id = s.id
      WHERE mpc.carrera_id = ? 
        AND mpc.periodo_id = ? 
        AND m.semestre_id = ?
      ORDER BY m.nombre ASC
    `;

    // 🚀 EJECUTAR CONSULTA
    const results = await new Promise<RowDataPacket[]>((resolve, reject) => { // ✅ Agregué tipo
      connection.query(query, [carrera_id, periodo_id, semestre_id], (error, results: RowDataPacket[]) => { // ✅ Agregué tipo
        if (error) {
          console.error('❌ Error en la consulta SQL:', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });

    console.log(`✅ Se encontraron ${results.length} materias`); // ✅ Ahora funciona directo

    // 📤 RESPUESTA EXITOSA
    res.status(200).json({
      success: true,
      msg: 'Materias obtenidas exitosamente',
      data: results,
      filtros: {
        carrera_id: Number(carrera_id),
        periodo_id: Number(periodo_id),
        semestre_id: Number(semestre_id)
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener materias filtradas:', error);
    res.status(500).json({
      success: false,
      msg: 'Error interno del servidor',
      error
    });
  }
};

// 📊 OBTENER TODAS LAS MATERIAS DE UNA CARRERA (TODOS LOS SEMESTRES)
export const obtenerMateriasPorCarrera = async (req: Request, res: Response): Promise<void> => { // ✅ Agregué : Promise<void>
  try {
    const { carrera_id, periodo_id } = req.query;
    
    if (!carrera_id || !periodo_id) {
      res.status(400).json({ // ✅ Quité return
        success: false,
        msg: 'Se requieren carrera_id y periodo_id'
      });
      return; // ✅ Solo return
    }

    const query = `
      SELECT 
        m.id,
        m.nombre,
        m.siglas,
        m.semestre_id,
        s.numero as semestre_numero,
        c.nombre as carrera_nombre
      FROM materias m
      INNER JOIN materiascarreras mpc ON m.id = mpc.materia_id
      INNER JOIN carreras c ON mpc.carrera_id = c.id
      INNER JOIN semestres s ON m.semestre_id = s.id
      WHERE mpc.carrera_id = ? 
        AND mpc.periodo_id = ?
      ORDER BY m.semestre_id ASC, m.nombre ASC
    `;

    const results = await new Promise<RowDataPacket[]>((resolve, reject) => { // ✅ Agregué tipo
      connection.query(query, [carrera_id, periodo_id], (error, results: RowDataPacket[]) => { // ✅ Agregué tipo
        if (error) reject(error);
        else resolve(results);
      });
    });

    res.status(200).json({
      success: true,
      msg: 'Materias por carrera obtenidas exitosamente',
      data: results
    });

  } catch (error) {
    console.error('❌ Error al obtener materias por carrera:', error);
    res.status(500).json({
      success: false,
      msg: 'Error interno del servidor'
    });
  }
};

// 🌟 OBTENER MATERIAS DE TRONCO COMÚN POR SEMESTRE
export const obtenerMateriasTroncoComun = async (req: Request, res: Response): Promise<void> => { // ✅ Agregué : Promise<void>
  try {
    const { periodo_id, semestre_id } = req.query;
    
    if (!periodo_id || !semestre_id) {
      res.status(400).json({ // ✅ Quité return
        success: false,
        msg: 'Se requieren periodo_id y semestre_id'
      });
      return; // ✅ Solo return
    }

    // Materias que están en TODAS las carreras (tronco común)
    const query = `
      SELECT 
        m.id,
        m.nombre,
        m.siglas,
        m.semestre_id,
        s.numero as semestre_numero,
        COUNT(DISTINCT mpc.carrera_id) as cantidad_carreras,
        (SELECT COUNT(*) FROM carreras) as total_carreras
      FROM materias m
      INNER JOIN materiascarreras mpc ON m.id = mpc.materia_id
      INNER JOIN semestres s ON m.semestre_id = s.id
      WHERE mpc.periodo_id = ? 
        AND m.semestre_id = ?
      GROUP BY m.id, m.nombre, m.siglas, m.semestre_id, s.numero
      HAVING cantidad_carreras = total_carreras
      ORDER BY m.nombre ASC
    `;

    const results = await new Promise<RowDataPacket[]>((resolve, reject) => { // ✅ Agregué tipo
      connection.query(query, [periodo_id, semestre_id], (error, results: RowDataPacket[]) => { // ✅ Agregué tipo
        if (error) reject(error);
        else resolve(results);
      });
    });

    res.status(200).json({
      success: true,
      msg: 'Materias de tronco común obtenidas exitosamente',
      data: results
    });

  } catch (error) {
    console.error('❌ Error al obtener materias tronco común:', error);
    res.status(500).json({
      success: false,
      msg: 'Error interno del servidor'
    });
  }
};

// 📋 OBTENER ESTADÍSTICAS DE MATERIAS POR CARRERA
export const obtenerEstadisticasMaterias = async (req: Request, res: Response): Promise<void> => { // ✅ Agregué : Promise<void>
  try {
    const { periodo_id } = req.query;
    
    if (!periodo_id) {
      res.status(400).json({ // ✅ Quité return
        success: false,
        msg: 'Se requiere periodo_id'
      });
      return; // ✅ Solo return
    }

    const query = `
      SELECT 
        c.id as carrera_id,
        c.nombre as carrera_nombre,
        c.siglas as carrera_siglas,
        s.numero as semestre,
        COUNT(mpc.materia_id) as cantidad_materias
      FROM carreras c
      CROSS JOIN semestres s
      LEFT JOIN materiascarreras mpc ON c.id = mpc.carrera_id
      LEFT JOIN materias m ON mpc.materia_id = m.id AND m.semestre_id = s.id
      WHERE mpc.periodo_id = ? OR mpc.periodo_id IS NULL
      GROUP BY c.id, c.nombre, c.siglas, s.numero
      ORDER BY c.nombre ASC, s.numero ASC
    `;

    const results = await new Promise<RowDataPacket[]>((resolve, reject) => { // ✅ Agregué tipo
      connection.query(query, [periodo_id], (error, results: RowDataPacket[]) => { // ✅ Agregué tipo
        if (error) reject(error);
        else resolve(results);
      });
    });

    res.status(200).json({
      success: true,
      msg: 'Estadísticas obtenidas exitosamente',
      data: results
    });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      msg: 'Error interno del servidor'
    });
  }
};