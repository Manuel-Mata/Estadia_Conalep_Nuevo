import { Request, Response } from 'express';
import db from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// ✅ MEJORAR: Obtener todas las referencias
export const obtenerTodas = (_req: Request, res: Response): void => {
  const sql = `
    SELECT 
      r.*,
      a.matricula,
      a.correo_institucional,
      c.nombre as concepto_nombre,
      car.nombre as carrera_nombre,
      s.numero as semestre_numero
    FROM REFERENCIAS r
    LEFT JOIN alumnos a ON r.alumno_id = a.id
    LEFT JOIN conceptos c ON r.concepto_id = c.id
    LEFT JOIN carreras car ON r.carrera_id = car.id
    LEFT JOIN semestres s ON r.semestre_id = s.id
    ORDER BY r.fecha_creacion DESC
  `;

  db.query(sql, (err, rows: RowDataPacket[]) => {
    if (err) {
      console.error('❌ Error al obtener referencias:', err);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor',
        details: err.message 
      });
      return;
    }
    
    console.log('✅ Referencias obtenidas:', rows.length);
    res.json({
      success: true,
      message: 'Referencias obtenidas exitosamente',
      data: rows
    });
  });
};

export const guardarReferencia = (req: Request, res: Response): void => {
  console.log('💾 === GUARDANDO REFERENCIA VBA ===');
  console.log('📊 Datos recibidos:', req.body);

  const {
    referencia_completa,
    referencia_base,
    digito_verificador,
    alumno_id,
    concepto_id,
    codigo_pago,
    importe,
    fecha_vencimiento,
    fecha_generada,
    dias_vigentes,
    estado,
    carrera_id,
    periodo_id,
    semestre_id,
    materia_id,
    descripcion,
    observaciones
  } = req.body;

  // ✅ VALIDACIONES
  if (!referencia_completa || !alumno_id || !concepto_id) {
    res.status(400).json({
      success: false,
      error: 'Datos requeridos faltantes',
      required: ['referencia_completa', 'alumno_id', 'concepto_id']
    });
    return;
  }

  // ✅ SQL AJUSTADO A TUS NOMBRES DE COLUMNA:
  const sql = `
    INSERT INTO REFERENCIAS (
      referencia_inicial,
      referencia_final,
      digito_verificador,
      alumno_id,
      concepto_id,
      codigo_plantel,
      importe,
      fecha_vencimiento,
      fecha_generada,
      dias_vigentes,
      estado,
      carrera_id,
      periodo_id,
      semestre_id,
      materia_id,
      observaciones,
      fecha_creacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const valores = [
    referencia_base,           // referencia_inicial
    referencia_completa,       // referencia_final
    digito_verificador,
    alumno_id,
    concepto_id,
    codigo_pago,               // codigo_plantel
    importe,
    fecha_vencimiento,
    fecha_generada,
    dias_vigentes,
    estado || 'Vigente',
    carrera_id,
    periodo_id,
    semestre_id,
    materia_id,
    observaciones
  ];

  console.log('📤 SQL:', sql);
  console.log('📊 Valores:', valores);

  db.query(sql, valores, (err: any, results: ResultSetHeader) => {
    if (err) {
      console.error('❌ Error al guardar referencia:', err);
      res.status(500).json({ 
        success: false,
        error: 'Error al guardar en la base de datos',
        details: err.message,
        code: err.code
      });
      return;
    }

    console.log('✅ Referencia guardada exitosamente. ID:', results.insertId);
    
    res.status(201).json({
      success: true,
      message: 'Referencia guardada exitosamente',
      data: {
        id: results.insertId,
        referencia_final: referencia_completa,
        importe,
        fecha_vencimiento,
        estado: estado || 'Vigente'
      }
    });
  });
};


export const obtenerReferenciasPorAlumno = (req: Request, res: Response): void => {
 const { alumno_id } = req.params;
 
 console.log('📋 Obteniendo referencias del alumno:', alumno_id);

 const sql = `
   SELECT 
     r.*,
     c.nombre as concepto_nombre,
     c.codigo_pago,
     car.nombre as carrera_nombre,
     s.numero as semestre_numero,
     p.nombre as periodo_nombre
   FROM REFERENCIAS r
   LEFT JOIN conceptos c ON r.concepto_id = c.id
   LEFT JOIN carreras car ON r.carrera_id = car.id
   LEFT JOIN semestres s ON r.semestre_id = s.id
   LEFT JOIN periodos p ON r.periodo_id = p.id
   WHERE r.alumno_id = ?
   ORDER BY r.fecha_creacion DESC
 `;

 db.query(sql, [alumno_id], (err, rows: RowDataPacket[]) => {
   if (err) {
     console.error('❌ Error al obtener referencias del alumno:', err);
     res.status(500).json({
       success: false,
       error: 'Error al obtener referencias',
       details: err.message
     });
     return;
   }

   console.log('✅ Referencias del alumno obtenidas:', rows.length);
   res.json({
     success: true,
     message: 'Referencias obtenidas exitosamente',
     data: rows
   });
 });
};

// ✅ NUEVO: Validar referencia
export const validarReferencia = (req: Request, res: Response): void => {
 const { referencia } = req.params;
 
 console.log('🔍 Validando referencia:', referencia);

 const sql = `
   SELECT 
     r.*,
     a.matricula,
     c.nombre as concepto_nombre,
     DATEDIFF(r.fecha_vencimiento, CURDATE()) as dias_restantes
   FROM REFERENCIAS r
   LEFT JOIN alumnos a ON r.alumno_id = a.id
   LEFT JOIN conceptos c ON r.concepto_id = c.id
   WHERE r.referencia_completa = ?
 `;

 db.query(sql, [referencia], (err, rows: RowDataPacket[]) => {
   if (err) {
     console.error('❌ Error al validar referencia:', err);
     res.status(500).json({
       success: false,
       error: 'Error en validación',
       details: err.message
     });
     return;
   }

   if (rows.length === 0) {
     res.status(404).json({
       success: false,
       valida: false,
       existe: false,
       message: 'Referencia no encontrada'
     });
     return;
   }

   const referencia_data = rows[0];
   const dias_restantes = referencia_data.dias_restantes;
   const es_valida = dias_restantes > 3 && referencia_data.estado === 'Vigente';

   console.log('✅ Referencia encontrada. Días restantes:', dias_restantes);

   res.json({
     success: true,
     valida: es_valida,
     existe: true,
     message: es_valida ? 'Referencia válida' : 'Referencia vencida o inválida',
     data: {
       referencia: referencia_data.referencia_completa,
       importe: referencia_data.importe,
       vencimiento: referencia_data.fecha_vencimiento,
       dias_restantes,
       estado: referencia_data.estado,
       concepto: referencia_data.concepto_nombre,
       matricula: referencia_data.matricula
     }
   });
 });
};

// ✅ MANTENER: Método anterior para compatibilidad
export const generarReferencia = (req: Request, res: Response): void => {
 // Tu método anterior - mantenerlo para compatibilidad con código existente
 const { alumno_id, concepto_id, periodo_id, referencia_base, importe, variable } = req.body;
 const fecha = new Date().toLocaleDateString('es-MX');
 
 // Aquí podrías usar tu algoritmo VBA antiguo si es necesario
 // const referenciaFinal = generarReferenciaPago(referencia_base, fecha, importe, variable);
 
 res.status(200).json({
   success: true,
   message: 'Usar el nuevo endpoint /referencias para algoritmo VBA'
 });
};