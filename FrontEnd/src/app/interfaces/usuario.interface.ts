
// Interface principal para Usuario
export interface Usuario {
  id: number;
  tipo_usuario: 'alumno' | 'admin';
  correo: string;
  alumno_id?: number;
  fecha_Creacion: Date | string;
  
  // Campos adicionales para alumnos (cuando hay JOIN con tabla Alumnos)
  nombre?: string;
  apellidos?: string;
  matricula?: string;
  
  // Campos adicionales opcionales
  activo?: boolean;
  ultimo_acceso?: Date | string;
}

// Interface específica para datos del alumno
export interface Alumno {
  id: number;
  matricula: string;
  nombre: string;
  apellidos: string;
  correo?: string;
  telefono?: string;
  fecha_nacimiento?: Date | string;
  carrera_id?: number;
  semestre?: number;
  grupo_id?: number;
  //estatus?: 'activo' | 'inactivo' | 'egresado';
  fecha_ingreso?: Date | string;
}

// Interface para crear un nuevo usuario
export interface CrearUsuario {
  tipo_usuario: 'alumno' | 'admin';
  correo: string;
  contrasena: string;
  alumno_id?: number;
}

// Interface para actualizar usuario
export interface ActualizarUsuario {
  correo?: string;
  contrasena?: string;
  activo?: boolean;
}

// Interface para perfil completo (Usuario + Alumno)
export interface PerfilCompleto extends Usuario {
  alumno?: Alumno;
}