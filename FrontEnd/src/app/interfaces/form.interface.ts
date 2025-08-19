// src/app/interfaces/form.interface.ts

// Interface para opciones de select/dropdown
export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
  group?: string;
}

// Interface para validación de campos
export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
}

// Interface para configuración de campos de formulario
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'textarea' | 'date';
  placeholder?: string;
  defaultValue?: any;
  validation?: FieldValidation;
  options?: SelectOption[];
  disabled?: boolean;
  hidden?: boolean;
  description?: string;
}

// Interface para estado del formulario
export interface FormState {
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  isSubmitting: boolean;
  errors: { [fieldName: string]: string[] };
}

// Interface para datos del formulario de login
export interface LoginFormData {
  matricula?: string;
  correo: string;
  contrasena: string;
  remember?: boolean;
}

// Interface para datos del formulario de registro
export interface RegistroFormData {
  matricula: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
  nombre: string;
  apellidos: string;
  terminos: boolean;
}