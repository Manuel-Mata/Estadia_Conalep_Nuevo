import { Usuario } from './usuario.interface';

// Interface para solicitud de login de alumno
export interface LoginAlumnoRequest {
  matricula: string;
  email: string;
  password: string;
  remember?: boolean;
}

// Interface para solicitud de login de admin
export interface LoginAdminRequest {
  correo: string;
  password: string;
  remember?: boolean;
}

// Interface para la respuesta del login
export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  usuario?: {
    id: number;
    tipo_usuario: 'alumno' | 'admin';
    correo: string;
    matricula?: string;
    alumno_id?: number;
    nombre?: string;
    apellidos?: string;
  };
}

// Interface para el estado de autenticación
export interface AuthState {
  isAuthenticated: boolean;
  usuario: Usuario | null;
  token: string | null;
  loading: boolean;
}

// Interface para cambio de contraseña
export interface CambiarContrasenaRequest {
  contrasenaActual: string;
  contrasenaNueva: string;
  confirmarContrasena: string;
}

// Interface para recuperar contraseña
export interface RecuperarContrasenaRequest {
  correo: string;
}

// Interface para resetear contraseña
export interface ResetearContrasenaRequest {
  token: string;
  contrasenaNueva: string;
  confirmarContrasena: string;
}

// Interface para validar token
export interface ValidarTokenResponse {
  valid: boolean;
  user?: {
    userId: number;
    correo: string;
    tipo_usuario: 'alumno' | 'admin';
    alumno_id?: number;
  };
  message?: string;
}

// Interface para refresh token
export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  message?: string;
}