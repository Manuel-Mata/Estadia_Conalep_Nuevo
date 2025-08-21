// src/controllers/usuarios.controllers.ts
import { Request, Response } from "express";
import connection from "../db/connection";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

export const getUsuarios = (req: Request, res: Response): void => {
    connection.query('SELECT * FROM Usuarios', (err: any, results: RowDataPacket[]) => {
        if (err) {
            console.error('Error al obtener usuarios', err);
            res.status(500).json({
                msg: 'Error en la base de datos',
                error: err
            });
            return;
        }
        res.json({
            msg: 'Usuarios obtenidos exitosamente',
            data: results
        });
    });
};

// ✅ Tipo de retorno corregido: Promise<void>
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { correo, contrasena, tipo_usuario, matricula } = req.body;

        console.log('🔍 Login intento:', { correo, tipo_usuario, matricula });

        if (!correo || !contrasena || !tipo_usuario) {
            res.status(400).json({
                success: false,
                message: 'Correo, contraseña y tipo de usuario son requeridos'
            });
            return;
        }

        let query: string;
        let queryParams: any[];

        if (tipo_usuario === 'alumno') {
            query = `
                SELECT u.*, a.matricula as alumno_matricula, a.correo_institucional 
                FROM Usuarios u 
                LEFT JOIN Alumnos a ON u.alumno_id = a.id 
                WHERE u.correo = ? AND u.tipo_usuario = ? AND a.matricula = ?
            `;
            queryParams = [correo.toLowerCase(), tipo_usuario, matricula];
        } else {
            // ✅ Corregido: quitar el alias 'u.'
            query = `SELECT * FROM Usuarios WHERE correo = ? AND tipo_usuario = ?`;
            queryParams = [correo.toLowerCase(), tipo_usuario];
        }

        connection.query(query, queryParams, async (err: any, results: RowDataPacket[]) => {
            if (err) {
                console.error('❌ Error BD:', err);
                res.status(500).json({
                    success: false,
                    message: 'Error en la base de datos'
                });
                return;
            }

            if (!results || results.length === 0) {
                res.status(401).json({
                    success: false,
                    message: 'Credenciales incorrectas - Usuario no encontrado'
                });
                return;
            }

            const usuario = results[0];

            try {
                let isPasswordValid = false;
                
                if (usuario.contrasena && usuario.contrasena.startsWith('$2b$')) {
                    isPasswordValid = await bcrypt.compare(contrasena, usuario.contrasena);
                } else {
                    isPasswordValid = contrasena === usuario.contrasena;
                }
                
                if (!isPasswordValid) {
                    res.status(401).json({
                        success: false,
                        message: 'Credenciales incorrectas - Contraseña inválida'
                    });
                    return;
                }

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

            } catch (passwordError) {
                console.error('❌ Error verificando contraseña:', passwordError);
                res.status(500).json({
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