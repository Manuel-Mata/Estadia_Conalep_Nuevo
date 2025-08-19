// src/app/services/reference-generator.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReferenciaData {
  concepto: string;
  fechaVencimiento: string;
  importe: number;
  variable: string;
  alumnoId?: number;
  matricula?: string;
  carrera_id?: number;
  periodo_id?: number;
  semestre_id?: number;
  materia_id?: number;
  descripcion?: string;
  usuario_creador?: string;
  observaciones?: string;
}

export interface ReferenciaGenerada {
  id?: number;
  referencia: string;
  concepto: string;
  descripcion?: string;
  fechaVencimiento: string;
  importe: number;
  fechaGeneracion: string;
  diasVigentes: number;
  estado: string;
  digitoVerificador?: string;
  referenciaBase?: string;
  pagado?: boolean;
  fechaPago?: string;
  metodoPago?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}


export interface ReferenciaValidacion {
  success: boolean;
  valida: boolean;
  existe: boolean;
  message?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ReferenceGeneratorService {
  private readonly BASE_URL = 'http://localhost:3000/api';

  // Valores de multiplicación para el algoritmo (del código VBA)
  private readonly VALORES_IMPORTE = [7, 3, 1];
  private readonly VALORES_REFERENCIA = [11, 13, 17, 19, 23];

  constructor(private http: HttpClient) {}

  /**
   * Genera una referencia bancaria válida siguiendo el algoritmo del macro VBA
   */
  generarReferencia(data: ReferenciaData): ReferenciaGenerada {
    try {
      // 1. Procesar fecha
      const fechaCondensada = this.procesarFecha(data.fechaVencimiento);
      
      // 2. Procesar importe
      const importeCondensado = this.procesarImporte(data.importe);
      
      // 3. Construir referencia base
      const referenciaBase = `${data.concepto}${fechaCondensada}${importeCondensado}${data.variable}`;
      
      // 4. Calcular dígito verificador
      const digitoVerificador = this.calcularDigitoVerificador(referenciaBase);
      
      // 5. Referencia final
      const referenciaFinal = `${referenciaBase}${digitoVerificador}`;
      
      // 6. Calcular días vigentes
      const fechaHoy = new Date();
      const fechaVenc = new Date(data.fechaVencimiento);
      const diasVigentes = Math.ceil((fechaVenc.getTime() - fechaHoy.getTime()) / (1000 * 60 * 60 * 24));

      return {
        referencia: referenciaFinal,
        concepto: data.concepto,
        descripcion: data.descripcion,
        fechaVencimiento: data.fechaVencimiento,
        importe: data.importe,
        fechaGeneracion: fechaHoy.toISOString().split('T')[0],
        diasVigentes: Math.max(0, diasVigentes),
        estado: diasVigentes > 0 ? 'Vigente' : 'Vencido'
      };

    } catch (error) {
      console.error('Error al generar referencia:', error);
      throw new Error('Error en la generación de referencia bancaria');
    }
  }

   /**
   * Crea una referencia en el backend (NUEVO)
   */
  crearReferencia(data: ReferenciaData): Observable<ApiResponse<ReferenciaGenerada>> {
    return this.http.post<ApiResponse<ReferenciaGenerada>>(`${this.BASE_URL}/referencias`, data);
  }

  /**
   * Guarda la referencia en la base de datos
   */
  guardarReferencia(referencia: ReferenciaGenerada, alumnoId: number): Observable<ApiResponse<ReferenciaGenerada>> {
    const payload = {
      ...referencia,
      alumnoId: alumnoId,
      fechaCreacion: new Date().toISOString()
    };

    return this.http.post<ApiResponse<ReferenciaGenerada>>(`${this.BASE_URL}/referencias`, payload);
  }

  /**
   * Obtiene las referencias de un alumno
   */
  obtenerReferenciasAlumno(alumnoId: number): Observable<ApiResponse<ReferenciaGenerada[]>> {
    return this.http.get<ApiResponse<ReferenciaGenerada[]>>(`${this.BASE_URL}/referencias/alumno/${alumnoId}`);
  }

  marcarComoPagada(referenciaId: number, datos: {
    metodoPago?: string;
    fechaPago?: string;
    observaciones?: string;
  }): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.BASE_URL}/referencias/${referenciaId}/pagar`, datos);
  }
  /**
   * Valida si una referencia es correcta
   */
  validarReferencia(referencia: string): Observable<ReferenciaValidacion> {
    return this.http.get<ReferenciaValidacion>(`${this.BASE_URL}/referencias/validar/${referencia}`);
  }


    validarReferenciaLocal(referencia: string): boolean {
    try {
      if (referencia.length < 4) return false;
      
      // Extraer dígito verificador (últimos 2 dígitos)
      const digitoRecibido = referencia.slice(-2);
      const referenciaBase = referencia.slice(0, -2);
      
      // Calcular dígito esperado
      const digitoCalculado = this.calcularDigitoVerificador(referenciaBase);
      
      return digitoRecibido === digitoCalculado;
    } catch (error) {
      return false;
    }
  }

  // ===== MÉTODOS PRIVADOS PARA EL ALGORITMO =====

  private procesarFecha(fecha: string): string {
    const fechaObj = new Date(fecha);
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

  private procesarImporte(importe: number): string {
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
      arregloImporte[i] = arregloImporte[i] * this.VALORES_IMPORTE[cuenta];
      cuenta++;
      if (cuenta === 3) {
        cuenta = 0;
      }
    }

    const resultadoImporte = arregloImporte.reduce((sum, val) => sum + val, 0);
    return (resultadoImporte % 10).toString();
  }

  private calcularDigitoVerificador(referencia: string): string {
    const arregloReferencia: number[] = [];
    
    for (let i = 0; i < referencia.length; i++) {
      const char = referencia[i].toUpperCase();
      let valor: number;
      
      if (!isNaN(parseInt(char))) {
        valor = parseInt(char);
      } else {
        valor = this.convertirLetraANumero(char);
      }
      
      arregloReferencia.push(valor);
    }

    let cuenta = 0;
    for (let i = arregloReferencia.length - 1; i >= 0; i--) {
      arregloReferencia[i] = arregloReferencia[i] * this.VALORES_REFERENCIA[cuenta];
      cuenta++;
      if (cuenta === 5) {
        cuenta = 0;
      }
    }

    const resultadoReferencia = arregloReferencia.reduce((sum, val) => sum + val, 0);
    let digitoVerificador = (resultadoReferencia % 97) + 1;
    
    return digitoVerificador.toString().padStart(2, '0');
  }

  private convertirLetraANumero(letra: string): number {
    const conversiones: { [key: string]: number } = {
      'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
      'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 6, 'P': 7, 'Q': 8, 'R': 9,
      'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9
    };
    
    return conversiones[letra] || 0;
  }
}