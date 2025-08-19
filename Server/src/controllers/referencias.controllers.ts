// controllers/referencias.controller.ts
import { Request, Response } from 'express';
import connection from '../db/connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// ===== INTERFACES =====
interface AlumnoData extends RowDataPacket {
    id: number;
    matricula: string;
    correo_institucional: string;
    carrera_id: number;
    semestre_id: number;
    carrera_nombre?: string;
    carrera_siglas?: string;
    semestre_numero?: number;
}

interface ConceptoData extends RowDataPacket {
    id: number;
    nombre: string;
    importe: number;
    codigo_plantel?: string;
}

interface ReferenciaData extends RowDataPacket {
    id: number;
    referencia_final: string;
    importe: number;
    fecha_vencimiento: string;
    fecha_generada: string;
    dias_vigentes: number;
    estado: string;
    pagado: boolean;
    matricula: string;
    correo_institucional: string;
    concepto_nombre: string;
}

interface ReferenciaVBAData {
    concepto: string;
    fechaVencimiento: string;
    importe: number;
    variable: string;
}

interface ReferenciaGenerada {
    referencia: string;
    referenciaBase: string;
    digitoVerificador: string;
    fechaGeneracion: string;
    diasVigentes: number;
    estado: string;
    codigoPlantel?: string;
}

// ===== CONSTANTES =====
const VALORES_IMPORTE = [7, 3, 1];
const VALORES_REFERENCIA = [11, 13, 17, 19, 23];

const MAPEO_CONCEPTOS: { [key: string]: { codigo: string, descripcion: string, importe: number } } = {
    'REINGRESO': { codigo: 'REI', descripcion: 'Reingreso', importe: 500.00 },
    'REINSCRIPCION': { codigo: 'RNS', descripcion: 'Reinscripción', importe: 300.00 },
    'CREDENCIAL': { codigo: 'CRE', descripcion: 'Credencial', importe: 150.00 },
    'ASESORIA_COMPLEMENTARIA': { codigo: 'ASE', descripcion: 'Asesoría Complementaria', importe: 250.00 },
    'EXAMEN_EXTRAORDINARIO': { codigo: 'EXE', descripcion: 'Examen Extraordinario', importe: 200.00 },
    'CONSTANCIA': { codigo: 'CON', descripcion: 'Constancia', importe: 100.00 }
};

// ===== FUNCIONES DE UTILIDAD =====

/**
 * Promisifica las queries de MySQL
 */
const queryAsync = (query: string, params?: any[]): Promise<any> => {
    return new Promise((resolve, reject) => {
        connection.query(query, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

/**
 * Procesa la fecha según el algoritmo VBA
 */
function procesarFecha(fecha: string): string {
    const fechaObj = new Date(fecha + 'T00:00:00');
    const año = fechaObj.getFullYear();
    const mes = fechaObj.getMonth() + 1;
    const dia = fechaObj.getDate();

    const valorAño = (año - 2014) * 372;
    const valorMes = (mes - 1) * 31;
    const valorDia = dia - 1;
    
    let fechaCondensada = (valorAño + valorMes + valorDia).toString();
    
    if (fechaCondensada.length < 4) {
        fechaCondensada = '0' + fechaCondensada;
    }
    
    return fechaCondensada;
}

/**
 * Procesa el importe según el algoritmo VBA
 */
function procesarImporte(importe: number): string {
    const parteEntera = Math.floor(importe);
    let decimales = Math.round((importe - parteEntera) * 100);
    
    if (decimales === 0) {
        decimales = 0;
    }

    const importeStr = `${parteEntera}${decimales.toString().padStart(2, '0')}`;
    
    const arregloImporte: number[] = [];
    for (let i = 0; i < importeStr.length; i++) {
        arregloImporte.push(parseInt(importeStr[i]));
    }

    let cuenta = 0;
    for (let i = arregloImporte.length - 1; i >= 0; i--) {
        arregloImporte[i] = arregloImporte[i] * VALORES_IMPORTE[cuenta];
        cuenta++;
        if (cuenta === 3) {
            cuenta = 0;
        }
    }

    const resultadoImporte = arregloImporte.reduce((sum, val) => sum + val, 0);
    return (resultadoImporte % 10).toString();
}

/**
 * Convierte letras a números según el algoritmo VBA
 */
function convertirLetraANumero(letra: string): number {
    const conversiones: { [key: string]: number } = {
        'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
        'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 6, 'P': 7, 'Q': 8, 'R': 9,
        'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9
    };
    
    return conversiones[letra] || 0;
}

/**
 * Calcula el dígito verificador según el algoritmo VBA
 */
function calcularDigitoVerificador(referencia: string): string {
    const arregloReferencia: number[] = [];
    
    for (let i = 0; i < referencia.length; i++) {
        const char = referencia[i].toUpperCase();
        let valor: number;
        
        if (!isNaN(parseInt(char))) {
            valor = parseInt(char);
        } else {
            valor = convertirLetraANumero(char);
        }
        
        arregloReferencia.push(valor);
    }

    let cuenta = 0;
    for (let i = arregloReferencia.length - 1; i >= 0; i--) {
        arregloReferencia[i] = arregloReferencia[i] * VALORES_REFERENCIA[cuenta];
        cuenta++;
        if (cuenta === 5) {
            cuenta = 0;
        }
    }

    const resultadoReferencia = arregloReferencia.reduce((sum, val) => sum + val, 0);
    let digitoVerificador = (resultadoReferencia % 97) + 1;
    
    return digitoVerificador.toString().padStart(2, '0');
}

/**
 * Función principal para generar referencia bancaria
 */
function generarReferenciaBancaria(data: ReferenciaVBAData): ReferenciaGenerada {
    try {
        // 1. Procesar fecha
        const fechaCondensada = procesarFecha(data.fechaVencimiento);
        
        // 2. Procesar importe
        const importeCondensado = procesarImporte(data.importe);
        
        // 3. Construir referencia base
        const referenciaBase = `${data.concepto}${fechaCondensada}${importeCondensado}${data.variable}`;
        
        // 4. Calcular dígito verificador
        const digitoVerificador = calcularDigitoVerificador(referenciaBase);
        
        // 5. Referencia final
        const referenciaFinal = `${referenciaBase}${digitoVerificador}`;
        
        // 6. Calcular días vigentes
        const fechaHoy = new Date();
        const fechaVenc = new Date(data.fechaVencimiento + 'T00:00:00');
        const diasVigentes = Math.ceil((fechaVenc.getTime() - fechaHoy.getTime()) / (1000 * 60 * 60 * 24));

        return {
            referencia: referenciaFinal,
            referenciaBase: referenciaBase,
            digitoVerificador: digitoVerificador,
            fechaGeneracion: fechaHoy.toISOString().split('T')[0],
            diasVigentes: Math.max(0, diasVigentes),
            estado: diasVigentes > 0 ? 'Vigente' : 'Vencido',
            codigoPlantel: '01' // Valor por defecto
        };

    } catch (error) {
        console.error('Error al generar referencia:', error);
        throw new Error('Error en la generación de referencia bancaria');
    }
}

//=========================================INICIO DE CONTROLADORES==========================================================================================================

export const getReferencias = async (req: Request, res: Response): Promise<void> => {
    try {
        const { limit = 50, offset = 0, estado, alumno } = req.query;
        
        let whereClause = '';
        const params: any[] = [];
        
        if (estado) {
            whereClause += ' WHERE r.estado = ?';
            params.push(estado);
        }
        
        if (alumno) {
            const operator = whereClause ? ' AND' : ' WHERE';
            whereClause += `${operator} (a.matricula LIKE ? OR a.correo_institucional LIKE ?)`;
            params.push(`%${alumno}%`, `%${alumno}%`);
        }
        
        const query = `
            SELECT 
                r.id,
                r.referencia_final as referencia,
                r.importe,
                r.fecha_vencimiento,
                r.fecha_generada,
                r.dias_vigentes,
                r.estado,
                r.pagado,
                a.matricula,
                a.correo_institucional,
                c.nombre as concepto_nombre
            FROM referencias r
            INNER JOIN alumnos a ON r.alumno_id = a.id
            INNER JOIN conceptos c ON r.concepto_id = c.id
            ${whereClause}
            ORDER BY r.fecha_generada DESC
            LIMIT ? OFFSET ?
        `;
        
        params.push(parseInt(limit as string), parseInt(offset as string));
        
        const results = await queryAsync(query, params) as ReferenciaData[];
        
        res.json({
            success: true,
            msg: 'Referencias obtenidas exitosamente',
            data: results,
            pagination: {
                limit: parseInt(limit as string),
                offset: parseInt(offset as string),
                total: results.length
            }
        });
        
    } catch (err) {
        console.error('Error al obtener referencias:', err);
        res.status(500).json({
            success: false,
            msg: 'Error en la base de datos',
            error: err instanceof Error ? err.message : 'Error desconocido'
        });
    }
};

export const getReferencia = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        if (!id || isNaN(parseInt(id))) {
            res.status(400).json({
                success: false,
                msg: 'ID de referencia inválido'
            });
            return;
        }
        
        const query = `
            SELECT 
                r.*,
                a.matricula,
                a.correo_institucional,
                c.nombre as concepto_nombre,
                c.importe as concepto_importe
            FROM referencias r
            INNER JOIN alumnos a ON r.alumno_id = a.id
            INNER JOIN conceptos c ON r.concepto_id = c.id
            WHERE r.id = ?
        `;
        
        const results = await queryAsync(query, [id]) as ReferenciaData[];
        
        if (results.length === 0) {
            res.status(404).json({
                success: false,
                msg: 'Referencia no encontrada',
                id: id
            });
            return;
        }
        
        res.json({
            success: true,
            data: results[0]
        });
        
    } catch (err) {
        console.error('Error al obtener la referencia:', err);
        res.status(500).json({
            success: false,
            msg: 'Error en la base de datos',
            error: err instanceof Error ? err.message : 'Error desconocido'
        });
    }
};

// ===== NUEVOS MÉTODOS NECESARIOS =====

// Obtener alumno por matrícula
export const getAlumnoPorMatricula = async (req: Request, res: Response): Promise<void> => {
    try {
        const { matricula } = req.params;
        
        if (!matricula?.trim()) {
            res.status(400).json({
                success: false,
                msg: 'Matrícula es requerida'
            });
            return;
        }
        
        const query = `
            SELECT 
                a.id,
                a.matricula,
                a.correo_institucional,
                a.carrera_id,
                a.semestre_id,
                c.nombre as carrera_nombre,
                c.siglas as carrera_siglas,
                s.numero as semestre_numero
            FROM alumnos a
            LEFT JOIN carreras c ON a.carrera_id = c.id
            LEFT JOIN semestres s ON a.semestre_id = s.id
            WHERE a.matricula = ?
        `;
        
        const results = await queryAsync(query, [matricula.trim()]) as AlumnoData[];
        
        if (results.length === 0) {
            res.status(404).json({
                success: false,
                msg: 'Alumno no encontrado'
            });
            return;
        }
        
        res.json({
            success: true,
            alumno: results[0]
        });
        
    } catch (err) {
        console.error('Error al buscar alumno:', err);
        res.status(500).json({
            success: false,
            msg: 'Error en la base de datos',
            error: err instanceof Error ? err.message : 'Error desconocido'
        });
    }
};

// Obtener todos los conceptos
export const getConceptos = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = 'SELECT id, nombre, importe, codigo_plantel FROM conceptos WHERE nombre IS NOT NULL ORDER BY nombre ASC';
        
        const results = await queryAsync(query);
        
        res.json({
            success: true,
            conceptos: results || []
        });
        
    } catch (err) {
        console.error('Error al obtener conceptos:', err);
        res.status(500).json({
            success: false,
            msg: 'Error en la base de datos',
            error: err instanceof Error ? err.message : 'Error desconocido'
        });
    }
};

// Obtener carreras
export const getCarreras = (req: Request, res: Response) => {
    const query = 'SELECT id, nombre, siglas FROM carreras ORDER BY nombre ASC';
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener carreras:', err);
            return res.status(500).json({
                success: false,
                msg: 'Error en la base de datos'
            });
        }
        
        res.json({
            success: true,
            carreras: results || []
        });
    });
};

// Obtener períodos
export const getPeriodos = (req: Request, res: Response) => {
    const query = 'SELECT id, nombre, fecha_inicio, fecha_fin FROM periodos ORDER BY fecha_inicio DESC';
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener períodos:', err);
            return res.status(500).json({
                success: false,
                msg: 'Error en la base de datos'
            });
        }
        
        res.json({
            success: true,
            periodos: results || []
        });
    });
};

// Obtener semestres
export const getSemestres = (req: Request, res: Response) => {
    const query = 'SELECT id, numero FROM semestres ORDER BY numero ASC';
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener semestres:', err);
            return res.status(500).json({
                success: false,
                msg: 'Error en la base de datos'
            });
        }
        
        res.json({
            success: true,
            semestres: results || []
        });
    });
};

// Obtener materias filtradas
export const getMateriasFiltradas = (req: Request, res: Response) => {
    const { carrera_id, periodo_id, semestre_id } = req.query;
    
    if (!carrera_id || !periodo_id || !semestre_id) {
        return res.status(400).json({
            success: false,
            msg: 'Se requieren carrera_id, periodo_id y semestre_id'
        });
    }
    
    const query = `
        SELECT DISTINCT 
            m.id,
            m.nombre,
            m.siglas,
            m.semestre_id,
            m.carrera_id
        FROM materias m
        INNER JOIN materiascarrera mc ON m.id = mc.materia_id
        INNER JOIN grupos g ON (
            g.carrera_id = mc.carrera_id 
            AND g.semestre_id = m.semestre_id
            AND g.periodo_id = ?
        )
        WHERE mc.carrera_id = ?
        AND m.semestre_id = ?
        ORDER BY m.nombre ASC
    `;
    
    connection.query(query, [periodo_id, carrera_id, semestre_id], (err, results) => {
        if (err) {
            console.error('Error al filtrar materias:', err);
            return res.status(500).json({
                success: false,
                msg: 'Error en la base de datos'
            });
        }
        
        res.json({
            success: true,
            materias: results || []
        });
    });
};

// ===== GENERAR REFERENCIA CON ALGORITMO VBA =====
export const generarReferencia = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            matricula,
            concepto,
            periodo_id,
            semestre_id,
            carrera_id,
            materia_id,
            importe,
            fechaVencimiento,
            usuario_creador,
            observaciones
        } = req.body;
        
        // Validaciones básicas
        if (!matricula || !concepto) {
            res.status(400).json({
                success: false,
                msg: 'Matrícula y concepto son requeridos'
            });
            return;
        }
        
        // Paso 1: Buscar alumno
        const alumnoQuery = 'SELECT id, matricula, carrera_id, semestre_id FROM alumnos WHERE matricula = ?';
        const alumnoResults = await queryAsync(alumnoQuery, [matricula]) as AlumnoData[];
        
        if (alumnoResults.length === 0) {
            res.status(404).json({
                success: false,
                msg: 'Alumno no encontrado'
            });
            return;
        }
        
        const alumno = alumnoResults[0];
        
        // Paso 2: Buscar concepto
        const conceptoQuery = 'SELECT id, nombre, importe FROM conceptos WHERE nombre = ?';
        const conceptoResults = await queryAsync(conceptoQuery, [concepto]) as ConceptoData[];
        
        if (conceptoResults.length === 0) {
            res.status(404).json({
                success: false,
                msg: 'Concepto no encontrado'
            });
            return;
        }
        
        const conceptoData = conceptoResults[0];
        
        // Paso 3: Configurar datos para la referencia
        let conceptoFinal = concepto;
        let importeBase = importe || conceptoData.importe || 100.00;
        let descripcionCompleta = concepto;
        
        if (MAPEO_CONCEPTOS[concepto]) {
            conceptoFinal = MAPEO_CONCEPTOS[concepto].codigo;
            descripcionCompleta = MAPEO_CONCEPTOS[concepto].descripcion;
            if (!importe) {
                importeBase = MAPEO_CONCEPTOS[concepto].importe;
            }
        }
        
        // Paso 4: Calcular fecha de vencimiento
        const fechaVenc = fechaVencimiento ? new Date(fechaVencimiento + 'T00:00:00') : new Date();
        if (!fechaVencimiento) {
            fechaVenc.setDate(fechaVenc.getDate() + 30); // 30 días por defecto
        }
        
        // Paso 5: Generar referencia
        const variable = materia_id ? materia_id.toString().padStart(3, '0') : '001';
        const referenciaGenerada = generarReferenciaBancaria({
            concepto: conceptoFinal,
            fechaVencimiento: fechaVenc.toISOString().split('T')[0],
            importe: importeBase,
            variable: variable
        });
        
        // Paso 6: Verificar que la referencia no exista
        const existeQuery = 'SELECT id FROM referencias WHERE referencia_final = ?';
        const existeResults = await queryAsync(existeQuery, [referenciaGenerada.referencia]);
        
        if (existeResults.length > 0) {
            res.status(409).json({
                success: false,
                msg: 'Ya existe una referencia con este número. Intente nuevamente.'
            });
            return;
        }
        
        // Paso 7: Insertar en base de datos
        const insertQuery = `
            INSERT INTO referencias (
                alumno_id, concepto_id, referencia_final, 
                importe, fecha_vencimiento, fecha_generada,
                dias_vigentes, estado, carrera_id, periodo_id, 
                semestre_id, materia_id, observaciones, usuario_creador,
                referencia_inicial, digito_verificador
            ) VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const insertValues = [
            alumno.id,
            conceptoData.id,
            referenciaGenerada.referencia,
            importeBase,
            fechaVenc.toISOString().split('T')[0],
            referenciaGenerada.diasVigentes,
            referenciaGenerada.estado,
            carrera_id || alumno.carrera_id,
            periodo_id || null,
            semestre_id || alumno.semestre_id,
            materia_id || null,
            observaciones || `Generada automáticamente para ${descripcionCompleta}`,
            usuario_creador || 'Sistema',
            referenciaGenerada.referenciaBase,
            referenciaGenerada.digitoVerificador
        ];
        
        const insertResult = await queryAsync(insertQuery, insertValues) as ResultSetHeader;
        
        // Respuesta exitosa
        res.status(201).json({
            success: true,
            msg: 'Referencia generada exitosamente',
            referencia: {
                id: insertResult.insertId,
                referencia: referenciaGenerada.referencia,
                concepto: conceptoFinal,
                descripcion: descripcionCompleta,
                importe: importeBase,
                fechaVencimiento: fechaVenc.toISOString().split('T')[0],
                fechaGeneracion: referenciaGenerada.fechaGeneracion,
                diasVigentes: referenciaGenerada.diasVigentes,
                estado: referenciaGenerada.estado,
                digitoVerificador: referenciaGenerada.digitoVerificador,
                referenciaBase: referenciaGenerada.referenciaBase,
                alumno: {
                    id: alumno.id,
                    matricula: alumno.matricula
                }
            }
        });
        
    } catch (err) {
        console.error('Error al generar referencia:', err);
        res.status(500).json({
            success: false,
            msg: 'Error al generar la referencia',
            error: err instanceof Error ? err.message : 'Error desconocido'
        });
    }
};

// ===== FUNCIÓN: ALGORITMO VBA =====
interface ReferenciaVBAData {
    concepto: string;
    fechaVencimiento: string;
    importe: number;
    variable: string;
}

function generarReferenciaVBA(data: ReferenciaVBAData): string {
    try {
        const VALORES_IMPORTE = [7, 3, 1];
        const VALORES_REFERENCIA = [11, 13, 17, 19, 23];

        // 1. Procesar fecha
        const fechaObj = new Date(data.fechaVencimiento + 'T00:00:00');
        const año = fechaObj.getFullYear();
        const mes = fechaObj.getMonth() + 1;
        const dia = fechaObj.getDate();

        const valorAño = (año - 2014) * 372;
        const valorMes = (mes - 1) * 31;
        const valorDia = dia - 1;
        
        let fechaCondensada = (valorAño + valorMes + valorDia).toString();
        if (fechaCondensada.length < 4) {
            fechaCondensada = '0' + fechaCondensada;
        }

        // 2. Procesar importe
        const parteEntera = Math.floor(data.importe);
        let decimales = Math.round((data.importe - parteEntera) * 100);
        if (decimales === 0) decimales = 0;

        const importeStr = `${parteEntera}${decimales.toString().padStart(2, '0')}`;
        const arregloImporte: number[] = [];
        for (let i = 0; i < importeStr.length; i++) {
            arregloImporte.push(parseInt(importeStr[i]));
        }

        let cuenta = 0;
        for (let i = arregloImporte.length - 1; i >= 0; i--) {
            arregloImporte[i] = arregloImporte[i] * VALORES_IMPORTE[cuenta];
            cuenta++;
            if (cuenta === 3) cuenta = 0;
        }

        const resultadoImporte = arregloImporte.reduce((sum, val) => sum + val, 0);
        const importeCondensado = (resultadoImporte % 10).toString();

        // 3. Construir referencia base
        const referenciaBase = `${data.concepto}${fechaCondensada}${importeCondensado}${data.variable}`;

        // 4. Calcular dígito verificador
        const arregloReferencia: number[] = [];
        for (let i = 0; i < referenciaBase.length; i++) {
            const char = referenciaBase[i].toUpperCase();
            let valor: number;
            
            if (!isNaN(parseInt(char))) {
                valor = parseInt(char);
            } else {
                // Conversión de letras a números (algoritmo VBA)
                const conversiones: { [key: string]: number } = {
                    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
                    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 6, 'P': 7, 'Q': 8, 'R': 9,
                    'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9
                };
                valor = conversiones[char] || 0;
            }
            arregloReferencia.push(valor);
        }

        cuenta = 0;
        for (let i = arregloReferencia.length - 1; i >= 0; i--) {
            arregloReferencia[i] = arregloReferencia[i] * VALORES_REFERENCIA[cuenta];
            cuenta++;
            if (cuenta === 5) cuenta = 0;
        }

        const resultadoReferencia = arregloReferencia.reduce((sum, val) => sum + val, 0);
        let digitoVerificador = (resultadoReferencia % 97) + 1;
        const digitoVerificadorStr = digitoVerificador.toString().padStart(2, '0');

        // 5. Referencia final
        return `${referenciaBase}${digitoVerificadorStr}`;

    } catch (error) {
        console.error('Error en algoritmo VBA:', error);
        // Fallback: generar referencia temporal
        const timestamp = Date.now().toString().slice(-8);
        return `${data.concepto}${timestamp}`;
    }
}

// Obtener referencias por alumno
export const getReferenciasAlumno = (req: Request, res: Response) => {
    const { alumnoId } = req.params;
    const { limit = 10, offset = 0, estado } = req.query;
    
    let whereClause = 'WHERE r.alumno_id = ?';
    let params: any[] = [alumnoId];
    
    if (estado) {
        whereClause += ' AND r.estado = ?';
        params.push(estado);
    }
    
    const query = `
        SELECT 
            r.*,
            c.nombre as concepto_nombre,
            a.matricula,
            a.correo_institucional
        FROM referencias r
        INNER JOIN conceptos c ON r.concepto_id = c.id
        INNER JOIN alumnos a ON r.alumno_id = a.id
        ${whereClause}
        ORDER BY r.fecha_generada DESC
        LIMIT ? OFFSET ?
    `;
    
    params.push(parseInt(limit as string), parseInt(offset as string));
    
    connection.query(query, params, (err, results) => {
        if (err) {
            console.error('Error al obtener referencias del alumno:', err);
            return res.status(500).json({
                success: false,
                msg: 'Error en la base de datos'
            });
        }
        
        res.json({
            success: true,
            referencias: results || []
        });
    });
};