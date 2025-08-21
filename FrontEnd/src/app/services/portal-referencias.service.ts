// ===== SERVICIO PARA PORTAL DE REFERENCIAS =====
// src/app/services/portal-referencias.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs'


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

  buscarAlumnoPorMatricula(matricula: string): Observable<AlumnoData> {
  return this.http.get<AlumnoData>(`${this.BASE_URL}/alumnos/matricula/${matricula}`);
}

  // Obtener todas las carreras
 obtenerCarreras(): Observable<Carrera[]> {
  return this.http.get<{msg: string, data: Carrera[]}>(`${this.BASE_URL}/carreras`).pipe(
    map(response => {
      console.log('📊 Respuesta carreras completa:', response);
      
      if (response.data && Array.isArray(response.data)) {
        const carreras = response.data;
        console.log('📊 Carreras procesadas:', carreras);
        return carreras;
      }
      return [];
    }),
    catchError(error => {
      console.error('❌ Error al obtener carreras:', error);
      return of([]);
    })
  );
}


obtenerConceptos(): Observable<Concepto[]> {
  return this.http.get<{success: boolean, conceptos: Concepto[]}>(`${this.BASE_URL}/conceptos`).pipe(
    map(response => {
      console.log('📊 Respuesta conceptos desde BD:', response);
      
      if (response.success && Array.isArray(response.conceptos)) {
        return response.conceptos.map(concepto => {
          // 🔧 CONVERTIR IMPORTE A NÚMERO SEGURO
          const importeNumerico = typeof concepto.importe === 'number' 
            ? concepto.importe 
            : parseFloat(concepto.importe) || 0;
            
          console.log(`📊 Concepto: ${concepto.nombre}, Importe original: ${concepto.importe} (${typeof concepto.importe}), Convertido: ${importeNumerico}`);
            
          return {
            ...concepto,
            importe: importeNumerico, // ✅ Asegurar que sea número
            value: concepto.codigo_pago.toString(),
            label: `${concepto.nombre} - $${importeNumerico.toFixed(2)}`
          };
        });
      }
      return [];
    }),
    catchError(error => {
      console.error('❌ Error al obtener conceptos:', error);
      return of([]); // Necesitarás importar 'of' de rxjs
    })
  );
}


  // Obtener todos los períodos
obtenerPeriodos(): Observable<Periodo[]> {
  return this.http.get<{success: boolean, periodos: Periodo[]}>(`${this.BASE_URL}/periodos`).pipe(
    map(response => {
      console.log('📊 Respuesta períodos completa:', response);
      
      if (response.success && Array.isArray(response.periodos)) {
        const periodos = response.periodos;
        console.log('📊 Períodos procesados:', periodos);
        return periodos;
      }
      return [];
    }),
    catchError(error => {
      console.error('❌ Error al obtener períodos:', error);
      return of([]);
    })
  );
}

  // Obtener todos los semestres
 obtenerSemestres(): Observable<Semestre[]> {
  return this.http.get<{msg: string, data: Semestre[]}>(`${this.BASE_URL}/semestres`).pipe(
    map(response => {
      console.log('📊 Respuesta semestres completa:', response);
      
      if (response.data && Array.isArray(response.data)) {
        const semestres = response.data;
        console.log('📊 Semestres procesados:', semestres);
        return semestres;
      }
      return [];
    }),
    catchError(error => {
      console.error('❌ Error al obtener semestres:', error);
      return of([]);
    })
  );
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
