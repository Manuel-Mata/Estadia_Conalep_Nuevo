// src/app/interfaces/api-response.interface.ts

// Interface genérica para respuestas de la API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: { [key: string]: string[] };
}

// Interface para respuestas con paginación
export interface ApiResponsePaginated<T = any> extends ApiResponse<T> {
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Interface para errores de la API
export interface ApiError {
  status: number;
  message: string;
  error?: string;
  details?: any;
  timestamp?: string;
}

// Interface para respuestas de validación
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResponse {
  success: false;
  message: string;
  errors: ValidationError[];
}

// Interface para respuestas de operaciones CRUD
export interface CrudResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  id?: number;
}

// Interface para respuestas de lista/búsqueda
export interface ListResponse<T = any> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

// Interface para respuestas de archivo/upload
export interface FileUploadResponse {
  success: boolean;
  message: string;
  filename?: string;
  url?: string;
  size?: number;
  type?: string;
}