// ===== SERVICIO PARA PORTAL DE REFERENCIAS =====
// src/app/services/portal-referencias.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


export interface AlumnoData {
  id: number;
  matricula: string;
  correo_institucional: string;
  carrera_id: number;
  semestre_id: number;
  carrera_nombre?: string;
  semestre_numero?: number;
}

export interface Carrera {
  id: number;
  nombre: string;
  siglas: string;
}

export interface Concepto {
  id: number;
  codigo_pago: number;  // Cambié a number para coincidir con tu BD
  nombre: string;
  importe: number;
  codigo_plantel: number;
  // Propiedades adicionales para el frontend
  value?: string;      // Para usar en el select
  label?: string;      // Para mostrar en la UI
}



export interface Periodo {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export interface Semestre {
  id: number;
  numero: number;
}

export interface Materia {
  id: number;
  nombre: string;
  siglas: string;
  semestre_id: number;
  carrera_id: number;
}

export interface Grupo {
  id: number;
  nombreGrupo: string;
  periodo_id: number;
  semestre_id: number;
  carrera_id: number;
}

export interface FiltrosReferencia {
  matricula: string;
  concepto: string;
  periodo_id?: number;
  semestre_id?: number;
  carrera_id?: number;
  materia_id?: number;
}

@Injectable({
  providedIn: 'root'
})

export class PortalReferenciasService {
  private readonly BASE_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Obtener datos del alumno por matrícula
  obtenerAlumnoPorMatricula(matricula: string): Observable<AlumnoData> {
    return this.http.get<AlumnoData>(`${this.BASE_URL}/alumnos/matricula/${matricula}`);
  }

  // Obtener todas las carreras
  obtenerCarreras(): Observable<Carrera[]> {
    return this.http.get<Carrera[]>(`${this.BASE_URL}/carreras`);
  }


obtenerConceptos(): Observable<Concepto[]> {
  return this.http.get<{success: boolean, conceptos: Concepto[]}>(`${this.BASE_URL}/conceptos`).pipe(
    map(response => {
      if (response.success && Array.isArray(response.conceptos)) {
        return response.conceptos.map(concepto => ({
          ...concepto,
          value: concepto.codigo_pago.toString(),
          label: `${concepto.nombre} - $${concepto.importe.toFixed(2)}`
        }));
      }
      return [];
    }),
  );
}


  // Obtener todos los períodos
  obtenerPeriodos(): Observable<Periodo[]> {
    return this.http.get<Periodo[]>(`${this.BASE_URL}/periodos`);
  }

  // Obtener todos los semestres
  obtenerSemestres(): Observable<Semestre[]> {
    return this.http.get<Semestre[]>(`${this.BASE_URL}/semestres`);
  }

  // Obtener materias filtradas por carrera, período y semestre
  obtenerMateriasFiltradas(carrera_id: number, periodo_id: number, semestre_id: number): Observable<any> {
      return this.http.get<any>(`${this.BASE_URL}/materias_por_carreras/filtradas`, {
      params: {
      carrera_id: carrera_id.toString(),
      periodo_id: periodo_id.toString(), 
      semestre_id: semestre_id.toString()
    }
  });
}

  // Obtener grupos disponibles
  obtenerGrupos(carrera_id: number, periodo_id: number, semestre_id: number): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(`${this.BASE_URL}/grupos`, {
      params: {
        carrera_id: carrera_id.toString(),
        periodo_id: periodo_id.toString(),
        semestre_id: semestre_id.toString()
      }
    });
  }

  // Generar referencia con filtros
  generarReferenciaConFiltros(filtros: FiltrosReferencia): Observable<any> {
    return this.http.post(`${this.BASE_URL}/referencias/generar`, filtros);
  }

   // MÉTODO TEMPORAL - Solo filtrar por semestre
  obtenerMateriasPorSemestre(semestre_id: number): Observable<any> {
    return this.http.get<any>(`${this.BASE_URL}/materias/semestre/${semestre_id}`);
  }

  

}
