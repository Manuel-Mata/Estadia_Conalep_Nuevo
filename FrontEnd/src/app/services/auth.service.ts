// src/app/services/auth.service.ts
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

// Interfaces
export interface LoginAlumnoRequest {
  matricula: string;
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  usuario?: any;
}

export interface Usuario {
  id: number;
  tipo_usuario: 'alumno' | 'admin';
  correo: string;
  matricula?: string;
  alumno_id?: number;
  nombre?: string;
  apellidos?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private API_URL = 'http://localhost:3000/api';
  private platformId = inject(PLATFORM_ID);
  
  constructor(private http: HttpClient) {}
  
  loginAlumno(credentials: LoginAlumnoRequest): Observable<LoginResponse> {
    const loginData = {
      matricula: credentials.matricula.toUpperCase().trim(),
      correo: credentials.email.toLowerCase().trim(),
      contrasena: credentials.password,
      tipo_usuario: 'alumno'
    };
    
    return this.http.post<LoginResponse>(`${this.API_URL}/usuarios/login`, loginData);
  }
  
  isAuthenticated(): boolean {
    // Solo verificar en el browser, no en el servidor
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    
    const token = localStorage.getItem('auth_token');
    return !!token; // Convertir a boolean
  }
  
  getCurrentUser(): Usuario | null {
    // Solo verificar en el browser, no en el servidor
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }
  
  logout(): void {
    // Solo limpiar en el browser, no en el servidor
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
  }
}