import { Request, Response } from "express";
import connection from "../db/connection";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const getUsuarios = (req: Request, res: Response) => {
    connection.query('SELECT * FROM Usuarios', (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios', err);
            return res.status(500).json({
                msg: 'Error en la base de datos',
                error: err
            });
        }
        res.json({
            msg: 'Usuarios obtenidos exitosamente',
            data: results
        });
    });
};

// ✅ AGREGAR ESTE MÉTODO LOGIN
export const login = async (req: Request, res: Response) => {
    try {
        const { correo, contrasena, tipo_usuario, matricula } = req.body;

        console.log('🔍 Login intento:', { correo, tipo_usuario, matricula });

        // Validar datos requeridos
        if (!correo || !contrasena || !tipo_usuario) {
            return res.status(400).json({
                success: false,
                message: 'Correo, contraseña y tipo de usuario son requeridos'
            });
        }

        // Consulta SQL ajustada a tu estructura real
        let query: string;
        let queryParams: any[];

        if (tipo_usuario === 'alumno') {
            // ✅ Solo seleccionar columnas que SÍ existen
            query = `
                SELECT u.*, a.matricula as alumno_matricula, a.correo_institucional 
                FROM Usuarios u 
                LEFT JOIN Alumnos a ON u.alumno_id = a.id 
                WHERE u.correo = ? AND u.tipo_usuario = ? AND a.matricula = ?
            `;
            queryParams = [correo.toLowerCase(), tipo_usuario, matricula];
        } else {
            query = `SELECT * FROM Usuarios WHERE correo = ? AND tipo_usuario = ?`;
            queryParams = [correo.toLowerCase(), tipo_usuario];
        }

        console.log('📋 Query SQL:', query);
        console.log('📋 Parámetros:', queryParams);

        // Ejecutar consulta
        connection.query(query, queryParams, async (err, results: any[]) => {
            if (err) {
                console.error('❌ Error BD:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error en la base de datos'
                });
            }

            console.log('📊 Resultados BD:', results);

            if (!results || results.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales incorrectas - Usuario no encontrado'
                });
            }

            const usuario = results[0];

            try {
                // Verificar contraseña
                let isPasswordValid = false;
                
                if (usuario.contrasena && usuario.contrasena.startsWith('$2b$')) {
                    isPasswordValid = await bcrypt.compare(contrasena, usuario.contrasena);
                } else {
                    isPasswordValid = contrasena === usuario.contrasena;
                }
                
                console.log('🔐 Verificación contraseña:', isPasswordValid);
                
                if (!isPasswordValid) {
                    return res.status(401).json({
                        success: false,
                        message: 'Credenciales incorrectas - Contraseña inválida'
                    });
                }

                // Generar token JWT
                const token = jwt.sign(
                    { 
                        userId: usuario.id,
                        correo: usuario.correo,
                        tipo_usuario: usuario.tipo_usuario,
                        alumno_id: usuario.alumno_id 
                    },
                    process.env.JWT_SECRET || 'mi_secreto_temporal_123',
                    { expiresIn: '24h' }
                );

                // ✅ Respuesta exitosa - sin campos que no existen
                res.json({
                    success: true,
                    message: 'Login exitoso',
                    token,
                    usuario: {
                        id: usuario.id,
                        tipo_usuario: usuario.tipo_usuario,
                        correo: usuario.correo,
                        alumno_id: usuario.alumno_id,
                        matricula: usuario.alumno_matricula || '',
                        correo_institucional: usuario.correo_institucional || ''
                    }
                });

                console.log('✅ Login exitoso para:', usuario.correo);

            } catch (passwordError) {
                console.error('❌ Error verificando contraseña:', passwordError);
                return res.status(500).json({
                    success: false,
                    message: 'Error verificando credenciales'
                });
            }
        });

    } catch (error) {
        console.error('❌ Error general login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};