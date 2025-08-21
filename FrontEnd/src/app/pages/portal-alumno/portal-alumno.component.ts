// src/app/pages/portal-alumno/portal-alumno.component.ts
import { Component, OnInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';


// Importar servicio de autenticación
import { AuthService } from '../../services/auth.service';
import {PortalReferenciasService} from '../../services/portal-referencias.service';
import { GeneradorReferenciaVbaService, ReferenciaCompleta } from '../../services/generador-referencia-vba.service';

@Component({
  selector: 'app-portal-alumno',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './portal-alumno.component.html',
  styleUrls: ['./portal-alumno.component.css']
})
export class PortalAlumnoComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  private platformId = inject(PLATFORM_ID);
  private readonly BANCO_NOMBRE = 'BBVA Bancomer, S.A.';
  private readonly CONVENIO_CIE = '1248030';
  private readonly INSTITUCION = 'CONALEP PLANTEL SAN FELIPE';
  
  // Datos del alumno
  currentUser: any = null;
  alumnoActualizado : any = null;
  pagosPendientes = 0;
  totalMonto = 0;
  datosTabla: any[] = [];
  datosOriginales: any[] = [];

  mostrarNotificacionCambio = false;
  cambiosDetectados : string[]= [];


  referenciasCargando = false;
  errorCargandoReferencias = false;
  referenciasFiltradas: any[] = [];
  ultimaActualizacion: Date = new Date();

    // ✅ PROPIEDADES PARA MEJORAR LA UX:
  sinReferencias = false;
  mostrarMensajeBienvenida = false;

  constructor(
    private authService: AuthService,
    private portalService : PortalReferenciasService,
    private generadorVBA: GeneradorReferenciaVbaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar autenticación
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/loginAlumno']);
      return;
    }

    // Cargar datos del usuario
    this.loadUserData();
    this.verificarDatosActualizados();
    
    // Cargar datos de pagos
    //this.loadPaymentData();

    // Inicializar reloj
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);

    // Exponer funciones al contexto global para que el HTML pueda llamarlas
    this.exposeGlobalFunctions();
      setTimeout(() => {
    console.log('🔄 Forzando loadPaymentData después de 2 segundos...');
    this.loadPaymentData();
  }, 2000);

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Limpiar funciones globales
    if (isPlatformBrowser(this.platformId)) {
      delete (window as any).cerrarSesion;
      delete (window as any).filtrarDatos;
      delete (window as any).limpiarFiltros;
      delete (window as any).descargarPDF;
      delete (window as any).descargarPapeleta;
      delete (window as any).cerrarModal;
    }
  }

  private loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
    console.log('Usuario actual:', this.currentUser);
  }

  private verificarDatosActualizados():void{
       if (!this.currentUser?.matricula) {
      console.warn('⚠️ No hay matrícula disponible para verificar datos');
      return;
      }
     console.log('🔍 Verificando datos actualizados para matrícula:', this.currentUser.matricula);

    this.portalService.obtenerAlumnoPorMatricula(this.currentUser.matricula)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('✅ Datos actualizados del servidor:', response);
          
          // Procesar respuesta
          const alumnoActual = response?.alumno || response;
          
          if (alumnoActual) {
            this.alumnoActualizado = alumnoActual;
            this.compararYActualizarDatos(alumnoActual);
          }
        },
        error: (error: any) => {
          console.error('❌ Error al verificar datos actualizados:', error);
          // No mostrar error al usuario, usar datos de localStorage como fallback
        }
      });
  }


private compararYActualizarDatos(datosActualizados: any): void {
    this.cambiosDetectados = [];

    if (!this.currentUser) return;

    // Comparar semestre
    if (this.currentUser.semestre_id !== datosActualizados.semestre_id) {
      const semestreAnterior = this.currentUser.semestre_id;
      const semestreNuevo = datosActualizados.semestre_id;
      
      this.cambiosDetectados.push(
        `Semestre actualizado: ${semestreAnterior} → ${semestreNuevo}`
      );
      
      console.log('📚 Cambio de semestre detectado:', {
        anterior: semestreAnterior,
        nuevo: semestreNuevo
      });
    }

    // Comparar carrera (por si cambiaron de carrera)
    if (this.currentUser.carrera_id !== datosActualizados.carrera_id) {
      this.cambiosDetectados.push('Carrera actualizada');
      
      console.log('🎓 Cambio de carrera detectado:', {
        anterior: this.currentUser.carrera_id,
        nuevo: datosActualizados.carrera_id
      });
    }

    // Comparar otros campos importantes
    if (this.currentUser.nombre !== datosActualizados.nombre) {
      this.cambiosDetectados.push('Información personal actualizada');
    }

    // Si hay cambios, actualizar localStorage y mostrar notificación
    if (this.cambiosDetectados.length > 0) {
      this.actualizarDatosLocales(datosActualizados);
      this.mostrarNotificacionCambios();
    }
  }


  //////////
  private mostrarNotificacionCambios(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.mostrarNotificacionCambio = true;
    
    // Crear mensaje de notificación
    const mensaje = `
      🎉 ¡Tus datos han sido actualizados!
      
      Cambios detectados:
      ${this.cambiosDetectados.map(cambio => `• ${cambio}`).join('\n')}
      
      Tu información se ha sincronizado automáticamente.
    `;

    // Mostrar notificación
    alert(mensaje);
    
    // Opcional: Puedes crear una notificación más elegante en el HTML
    this.mostrarNotificacionEnHTML();
    
    // Ocultar notificación después de un tiempo
    setTimeout(() => {
      this.mostrarNotificacionCambio = false;
    }, 5000);
  }


   private mostrarNotificacionEnHTML(): void {
    console.log('📢 Mostrando notificación de cambios en HTML');
    
  }


    actualizarDatosManualmente(): void {
    console.log('🔄 Actualizando datos manualmente...');
    this.verificarDatosActualizados();
  }

  // 🆕 GETTER: Para usar en el template
  get datosActualizadosDisponibles(): boolean {
    return !!this.alumnoActualizado;
  }

  // 🆕 GETTER: Para mostrar información actualizada en el template
  get informacionActual(): any {
    return this.alumnoActualizado || this.currentUser;
  }


  

  private actualizarDatosLocales(datosActualizados: any): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      // Actualizar objeto currentUser con los nuevos datos
      const usuarioActualizado = {
        ...this.currentUser,
        ...datosActualizados
      };

      // Guardar en localStorage
      localStorage.setItem('current_user', JSON.stringify(usuarioActualizado));
      
      // Actualizar la referencia local
      this.currentUser = usuarioActualizado;
      
      console.log('💾 Datos actualizados en localStorage:', usuarioActualizado);
    } catch (error) {
      console.error('❌ Error al actualizar datos en localStorage:', error);
    }
  }





/**
  private loadPaymentData(): void {
    // Simular datos de ejemplo - aquí conectarías con tu servicio real
    this.datosOriginales = [
      {
        motivo: 'Colegiatura Enero 2024',
        referencia: 'REF001234',
        fechaValidacion: '2024-01-15',
        diasVigentes: 30,
        costoTotal: 2500.00,
        estado: 'Pendiente'
      },
      {
        motivo: 'Material Didáctico',
        referencia: 'REF001235',
        fechaValidacion: '2024-01-20',
        diasVigentes: 45,
        costoTotal: 850.00,
        estado: 'Vencido'
      }
    ];

    this.datosTabla = [...this.datosOriginales];
    this.updateStats();
    this.renderTable();
  }
    */
private loadPaymentData(): void {
  console.log('📋 === CARGANDO REFERENCIAS REALES DESDE BD ===');
  console.log('📋 === CARGANDO REFERENCIAS REALES DESDE BD ===');
  console.log('👤 Usuario actual en loadPaymentData:', this.currentUser);
  
  
  // Verificar que hay usuario autenticado
  if (!this.currentUser?.id) {
    console.warn('⚠️ No hay usuario autenticado para cargar referencias');
    this.sinReferencias = true;
    this.mostrarMensajeBienvenida = true;
    this.datosOriginales = [];
    this.datosTabla = [];
    this.updateStats();
    this.renderTable();
    return;
  }

  console.log('👤 Cargando referencias del alumno ID:', this.currentUser.id);
  
  // 🔄 Mostrar estado de carga
  this.referenciasCargando = true;
  this.errorCargandoReferencias = false;
  this.sinReferencias = false;

  // 🚀 LLAMAR AL BACKEND PARA OBTENER REFERENCIAS REALES
  this.generadorVBA.obtenerReferenciasAlumno(this.currentUser.id)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta completa del backend:', response);
        
        this.procesarRespuestaReferencias(response);
        this.referenciasCargando = false;
        this.ultimaActualizacion = new Date();
      },
      error: (error: any) => {
        console.error('❌ Error al cargar referencias:', error);
        this.manejarErrorCargaReferencias(error);
        this.referenciasCargando = false;
      }
    });
}



private procesarRespuestaReferencias(response: any): void {
  try {
    let referencias: any[] = [];

    // 🔍 Detectar diferentes formatos de respuesta
    if (response && response.success && Array.isArray(response.data)) {
      referencias = response.data;
      console.log('✅ Formato con success:', referencias.length, 'referencias');
    } else if (Array.isArray(response)) {
      referencias = response;
      console.log('✅ Formato array directo:', referencias.length, 'referencias');
    } else if (response && Array.isArray(response.referencias)) {
      referencias = response.referencias;
      console.log('✅ Formato con .referencias:', referencias.length, 'referencias');
    } else {
      console.warn('⚠️ Formato de respuesta inesperado:', response);
      referencias = [];
    }

    // 🔄 Transformar datos para la tabla
    if (referencias.length > 0) {
      this.datosOriginales = this.transformarReferenciasParaTabla(referencias);
      this.sinReferencias = false;
      this.mostrarMensajeBienvenida = false;
      
      console.log('✅ Referencias transformadas:', this.datosOriginales);
    } else {
      // No hay referencias para este alumno
      this.datosOriginales = [];
      this.sinReferencias = true;
      this.mostrarMensajeBienvenida = true;
      
      console.log('📋 No hay referencias para este alumno');
    }

    // 📊 Actualizar vista
    this.datosTabla = [...this.datosOriginales];
    this.updateStats();
    this.renderTable();
    this.errorCargandoReferencias = false;

  } catch (error) {
    console.error('❌ Error procesando referencias:', error);
    this.manejarErrorCargaReferencias(error);
  }
}



private manejarErrorCargaReferencias(error: any): void {
  this.errorCargandoReferencias = true;
  this.datosOriginales = [];
  this.datosTabla = [];
  
  // 🔄 Mostrar mensaje de error específico
  let mensajeError = 'Error desconocido';
  
  if (error.status === 404) {
    mensajeError = 'No se encontraron referencias para este alumno';
    this.sinReferencias = true;
  } else if (error.status === 0) {
    mensajeError = 'Sin conexión al servidor';
  } else if (error.status >= 500) {
    mensajeError = 'Error del servidor';
  } else {
    mensajeError = error.message || 'Error al cargar referencias';
  }

  console.error('💥 Error específico:', mensajeError);
  
  // 📊 Actualizar vista con error
  this.updateStats();
  this.renderTable();
  
  // 🔄 Mostrar datos de ejemplo si es necesario para desarrollo
  if (this.isDevelopmentMode()) {
    console.log('🔧 Modo desarrollo: Cargando datos de ejemplo');
    this.cargarDatosFallback();
  }
}
private isDevelopmentMode(): boolean {
  return !isPlatformBrowser(this.platformId) || 
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1';
}


private cargarDatosFallback(): void {
  console.log('🔄 Cargando datos de ejemplo como fallback');
  
  this.datosOriginales = [
    {
      id: 'ejemplo_1',
      motivo: '⚠️ DATOS DE EJEMPLO - Sin conexión a BD',
      referencia: 'EJEMPLO_001',
      fechaValidacion: new Date().toLocaleDateString('es-MX'),
      diasVigentes: 15,
      costoTotal: 2500.00,
      estado: 'Vigente',
      fechaVencimientoOriginal: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      referenciaCompleta: 'EJEMPLO_001'
    },
    {
      id: 'ejemplo_2',
      motivo: '⚠️ DATOS DE EJEMPLO - Material Didáctico',
      referencia: 'EJEMPLO_002',
      fechaValidacion: new Date().toLocaleDateString('es-MX'),
      diasVigentes: 5,
      costoTotal: 850.00,
      estado: 'Por Vencer',
      fechaVencimientoOriginal: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      referenciaCompleta: 'EJEMPLO_002'
    }
  ];

  this.datosTabla = [...this.datosOriginales];
  this.updateStats();
  this.renderTable();
  this.errorCargandoReferencias = false;
  this.sinReferencias = false;
}



/**
private transformarReferenciasParaTabla(referencias: any[]): any[] {
  return referencias.map(ref => ({
    motivo: ref.descripcion || ref.concepto_nombre || 'Concepto sin descripción',
    referencia: ref.referencia_completa || ref.referencia_final,
    fechaValidacion: this.formatearFecha(ref.fecha_vencimiento),
    diasVigentes: this.calcularDiasVigentes(ref.fecha_vencimiento),
    costoTotal: parseFloat(ref.importe) || 0,
    estado: this.determinarEstado(ref)
  }));
}
*/


/**
private determinarEstado(referencia: any): string {
  const hoy = new Date();
  const vencimiento = new Date(referencia.fecha_vencimiento);
  const diasRestantes = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  if (referencia.estado === 'Pagado' || referencia.pagado) {
    return 'Pagado';
  } else if (diasRestantes < 0) {
    return 'Vencido';
  } else if (diasRestantes <= 3) {
    return 'Por Vencer';
  } else {
    return 'Vigente';
  }
}
 */

  /**
 * 📅 Calcular días vigentes restantes
 */
private calcularDiasVigentes(fechaVencimiento: string): number {
  try {
    if (!fechaVencimiento || fechaVencimiento === null || fechaVencimiento === 'null') {
      console.warn('⚠️ Fecha vencimiento null:', fechaVencimiento);
      return 0;
    }

    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    
    // ✅ Verificar si la fecha es válida
    if (isNaN(vencimiento.getTime()) || vencimiento.getFullYear() < 1900) {
      console.warn('⚠️ Fecha vencimiento inválida:', fechaVencimiento);
      return 0;
    }

    const diasRestantes = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diasRestantes);
  } catch (error) {
    console.warn('⚠️ Error calculando días vigentes:', fechaVencimiento, error);
    return 0;
  }
}





  private formatearFecha(fecha: string): string {
  try {
    // ✅ Manejar diferentes casos de fecha
    if (!fecha || fecha === null || fecha === 'null') {
      console.warn('⚠️ Fecha null o undefined:', fecha);
      return 'Sin fecha';
    }

    // ✅ Si la fecha es una fecha muy antigua (como 1899), es probable que sea NULL en BD
    const fechaObj = new Date(fecha);
    
    if (fechaObj.getFullYear() < 1900) {
      console.warn('⚠️ Fecha muy antigua detectada (probablemente NULL en BD):', fecha);
      return 'Fecha no válida';
    }

    if (isNaN(fechaObj.getTime())) {
      console.warn('⚠️ Fecha inválida:', fecha);
      return 'Fecha inválida';
    }

    return fechaObj.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.warn('⚠️ Error formateando fecha:', fecha, error);
    return 'Error en fecha';
  }
}

/**
private cargarDatosFallback(): void {
  console.log('🔄 Cargando datos de ejemplo como fallback');
  
  this.datosOriginales = [
    {
      motivo: 'Sin conexión a BD - Datos de ejemplo',
      referencia: 'SIN_CONEXION',
      fechaValidacion: new Date().toLocaleDateString('es-MX'),
      diasVigentes: 0,
      costoTotal: 0,
      estado: 'Error'
    }
  ];

  this.datosTabla = [...this.datosOriginales];
  this.updateStats();
  this.renderTable();
}
*/
/**
private determinarEstado(referencia: any): string {
  const hoy = new Date();
  const vencimiento = new Date(referencia.fecha_vencimiento);
  const diasRestantes = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  if (referencia.estado === 'Pagado' || referencia.pagado) {
    return 'Pagado';
  } else if (diasRestantes < 0) {
    return 'Vencido';
  } else if (diasRestantes <= 3) {
    return 'Por Vencer';
  } else {
    return 'Vigente';
  }
}


private calcularDiasVigentes(fechaVencimiento: string): number {
  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);
  const diasRestantes = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diasRestantes);
}
*/











  private updateStats(): void {
    this.pagosPendientes = this.datosTabla.filter(item => item.estado === 'Pendiente').length;
    this.totalMonto = this.datosTabla.reduce((sum, item) => sum + item.costoTotal, 0);

    // Actualizar DOM
    if (isPlatformBrowser(this.platformId)) {
      const pagosPendientesEl = document.getElementById('pagosPendientes');
      const totalMontoEl = document.getElementById('totalMonto');
      
      if (pagosPendientesEl) pagosPendientesEl.textContent = this.pagosPendientes.toString();
      if (totalMontoEl) totalMontoEl.textContent = `$${this.totalMonto.toFixed(2)}`;
    }
  }

private renderTable(): void {
  if (!isPlatformBrowser(this.platformId)) return;

  const tableBody = document.getElementById('tableBody');
  if (!tableBody) return;
  

  // 🔄 Estado de carga
  if (this.referenciasCargando) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px;">
          <div class="loading-inline">
            <div class="spinner"></div>
            <p>🔄 Cargando tus referencias...</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // ❌ Error de carga
  if (this.errorCargandoReferencias) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px;">
          <div style="color: #d32f2f;">
            <h3>❌ Error al cargar referencias</h3>
            <p>No se pudieron cargar tus referencias. Verifica tu conexión.</p>
            <button onclick="location.reload()" class="btn btn-blue" style="margin-top: 10px;">
              🔄 Reintentar
            </button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // 📋 Sin referencias
  if (this.datosTabla.length === 0) {
    if (this.sinReferencias) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px;">
            <div style="color: #4a90e2;">
              <h3>📋 ¡Bienvenido!</h3>
              <p>Aún no tienes referencias generadas.</p>
              <p>Haz clic en <strong>"GENERAR NUEVO PAGO"</strong> para crear tu primera referencia.</p>
            </div>
          </td>
        </tr>
      `;
    } else {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center;">
            📋 No hay datos disponibles
          </td>
        </tr>
      `;
    }
    return;
  }

  // ✅ Mostrar referencias CON CHECKBOX + BOTONES DE ACCIÓN
  tableBody.innerHTML = this.datosTabla.map(item => `
    <tr class="${item.estado.toLowerCase().replace(/\s+/g, '-')}">
      <!-- ✅ CHECKBOX -->
      <td>
        <input type="checkbox" 
               class="reference-checkbox" 
               value="${item.id}" 
               onchange="updateDownloadButton()">
      </td>
      <td>${item.motivo}</td>
      <td style="font-family: monospace; font-weight: bold;">${item.referencia}</td>
      <td>${item.fechaValidacion}</td>
      <td>
        <span class="dias-badge ${this.getClassesDiasVigentes(item.diasVigentes)}">
          ${item.diasVigentes} días
        </span>
      </td>
      <td style="font-weight: bold; color: #4a90e2;">
        $${item.costoTotal.toFixed(2)}
      </td>
      <!-- ✅ COLUMNA DE ACCIONES -->
      <td>
        <div class="action-buttons">
          <button class="btn-icon btn-copy" 
                  onclick="copiarReferencia('${item.referencia}')" 
                  title="Copiar referencia">
            📋
          </button>
          <button class="btn-icon btn-details" 
                  onclick="verDetalles(${item.id})" 
                  title="Ver detalles">
            👁️
          </button>
          <button class="btn-icon btn-download" 
                  onclick="descargarComprobante(${item.id})" 
                  title="Descargar comprobante">
            📄
          </button>
          <button class="btn-icon btn-cancel" 
                  onclick="anularReferencia(${item.id})" 
                  ${item.estado === 'Pagado' ? 'disabled' : ''}
                  title="Anular referencia">
            🚫
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}


private getClassesDiasVigentes(dias: number): string {
  if (dias <= 0) return 'dias-vencido';
  if (dias <= 3) return 'dias-critico';
  if (dias <= 7) return 'dias-alerta';
  return 'dias-normal';
}

  private updateClock(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const clockElement = document.getElementById('currentTime');
    if (clockElement) {
      clockElement.textContent = timeString;
    }
  }

  private exposeGlobalFunctions(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Función principal para cerrar sesión
    (window as any).cerrarSesion = () => {
      this.cerrarSesion();
    };

    // Otras funciones del portal
    (window as any).filtrarDatos = () => {
      this.filtrarDatos();
    };

    (window as any).limpiarFiltros = () => {
      this.limpiarFiltros();
    };

    (window as any).descargarPDF = () => {
      this.descargarPDF();
    };

    (window as any).descargarPapeleta = () => {
      this.descargarPapeleta();
    };

    (window as any).cerrarModal = () => {
      this.cerrarModal();
    };

    (window as any).actualizarDatos = () =>{
      this.actualizarDatosManualmente
    }

    (window as any).copiarReferencia = (referencia: string) => {
      this.copiarReferencia(referencia);
    };

    (window as any).verDetalles = (id: number) => {
      this.verDetalles(id);
    };

    (window as any).descargarComprobante = (id: number) => {
      this.descargarComprobante(id);
    };

    (window as any).anularReferencia = (id: number) => {
      this.anularReferencia(id);
    };
  }

  // FUNCIÓN PRINCIPAL: CERRAR SESIÓN
  cerrarSesion(): void {
    // Mostrar confirmación
    if (!isPlatformBrowser(this.platformId)) return;

    const confirmLogout = confirm('¿Estás seguro de que deseas cerrar sesión?');
    
    if (confirmLogout) {
      try {
        // Limpiar datos de autenticación
        this.authService.logout();
        
        // Mostrar mensaje de confirmación
        alert('Sesión cerrada correctamente');
        
        // Redirigir al login
        this.router.navigate(['/loginAlumno'], {
          state: { forceLogout: true }
        });
        
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión. Intenta nuevamente.');
      }
    }
  }


  copiarReferencia(referencia: string): void {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(referencia).then(() => {
      alert('📋 Referencia copiada al portapapeles');
    });
  } else {
    // Fallback para navegadores sin clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = referencia;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('📋 Referencia copiada al portapapeles');
  }
}

verDetalles(id: number): void {
  const referencia = this.datosTabla.find(item => item.id === id);
  if (referencia) {
    alert(`👁️ DETALLES DE LA REFERENCIA\n\n` +
          `Motivo: ${referencia.motivo}\n` +
          `Referencia: ${referencia.referencia}\n` +
          `Fecha: ${referencia.fechaValidacion}\n` +
          `Días vigentes: ${referencia.diasVigentes}\n` +
          `Costo: $${referencia.costoTotal.toFixed(2)}\n` +
          `Estado: ${referencia.estado}`);
  }
}


descargarComprobante(id: number): void {
  const referencia = this.datosTabla.find(item => item.id === id);
  if (referencia) {
    console.log('📄 Descargando comprobante para referencia:', referencia.referencia);
    this.generarPDFReferenciaIndividual(referencia);
  } else {
    alert('❌ No se encontró la referencia seleccionada');
  }
}

anularReferencia(id: number): void {
  const referencia = this.datosTabla.find(item => item.id === id);
  if (referencia && referencia.estado !== 'Pagado') {
    const confirmar = confirm(`¿Estás seguro de anular la referencia ${referencia.referencia}?`);
    if (confirmar) {
      console.log('🚫 Anulando referencia ID:', id);
      // Implementar anulación en backend
      alert('🚫 Función de anulación en desarrollo');
    }
  }
}

  // Función para filtrar datos
  filtrarDatos(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const searchRef = (document.getElementById('searchRef') as HTMLInputElement)?.value || '';
    const filterStatus = (document.getElementById('filterStatus') as HTMLSelectElement)?.value || '';
    const dateFrom = (document.getElementById('dateFrom') as HTMLInputElement)?.value || '';
    const dateTo = (document.getElementById('dateTo') as HTMLInputElement)?.value || '';

    this.datosTabla = this.datosOriginales.filter(item => {
      const matchRef = searchRef === '' || item.referencia.toLowerCase().includes(searchRef.toLowerCase());
      const matchStatus = filterStatus === '' || item.estado === filterStatus;
      const matchDateFrom = dateFrom === '' || new Date(item.fechaValidacion) >= new Date(dateFrom);
      const matchDateTo = dateTo === '' || new Date(item.fechaValidacion) <= new Date(dateTo);

      return matchRef && matchStatus && matchDateFrom && matchDateTo;
    });

    this.updateStats();
    this.renderTable();
  }

  // Función para limpiar filtros
  limpiarFiltros(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const searchRef = document.getElementById('searchRef') as HTMLInputElement;
    const filterStatus = document.getElementById('filterStatus') as HTMLSelectElement;
    const dateFrom = document.getElementById('dateFrom') as HTMLInputElement;
    const dateTo = document.getElementById('dateTo') as HTMLInputElement;

    if (searchRef) searchRef.value = '';
    if (filterStatus) filterStatus.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';

    this.datosTabla = [...this.datosOriginales];
    this.updateStats();
    this.renderTable();
  }

  // Función auxiliar para ocultar elementos durante la captura
  private hideElementsForCapture(): void {
    const elementsToHide = [
      '.button-section',
      'footer',
      '.search-section'
    ];

    elementsToHide.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
        (el as HTMLElement).setAttribute('data-hidden-for-pdf', 'true');
      });
    });
  }

  // Función auxiliar para mostrar elementos después de la captura
  private showElementsAfterCapture(): void {
    const hiddenElements = document.querySelectorAll('[data-hidden-for-pdf="true"]');
    hiddenElements.forEach(el => {
      (el as HTMLElement).style.display = '';
      (el as HTMLElement).removeAttribute('data-hidden-for-pdf');
    });
  }

  // Función para descargar PDF
  async descargarPDF(): Promise<void> {
  try {
    const user = this.currentUser;
    const fechaActual = new Date().toLocaleDateString('es-MX');

    // ✅ Obtener checkboxes seleccionados
    const seleccionados: number[] = Array.from(document.querySelectorAll<HTMLInputElement>('.reference-checkbox:checked'))
      .map(chk => parseInt(chk.value));

    if (seleccionados.length === 0) {
      alert('⚠️ Selecciona al menos una referencia');
      return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    seleccionados.forEach((id, index) => {
      const referencia = this.datosTabla.find(r => r.id === id);
      if (!referencia) return;

      // =========================
      // 🔵 ENCABEZADO ESTILO BANCO
      // =========================
      pdf.setFillColor(0, 84, 166); // Azul BBVA
      pdf.rect(0, 0, pageWidth, 20, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("BBVA Bancomer, S.A.", 20, 12);

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.text("Institución Bancaria:", 20, 30);
      pdf.text("BBVA Bancomer, S.A.", 70, 30);

      pdf.text("Convenio CIE:", 20, 36);
      pdf.text("1248030", 70, 36);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("CONALEP PLANTEL SAN FELIPE", pageWidth / 2, 50, { align: "center" });

      // =========================
      // 🔑 REFERENCIA DE PAGO
      // =========================
      pdf.setFontSize(14);
      pdf.text("REFERENCIA DE PAGO", pageWidth / 2, 65, { align: "center" });

      // ✅ Referencia en línea continua (sin espacios)
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(13);
      pdf.text(referencia.referencia, pageWidth / 2, 75, { align: "center" });

      // =========================
      // 💰 DATOS DEL PAGO
      // =========================
      let yPos = 95;
      const leftCol = 30;
      const rightCol = 120;

      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.rect(20, yPos - 10, pageWidth - 40, 50);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("DATOS DEL PAGO", leftCol, yPos);
      yPos += 10;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.text("Concepto:", leftCol, yPos);
      pdf.text(referencia.motivo, rightCol, yPos);
      yPos += 6;

      pdf.text("Importe:", leftCol, yPos);
      pdf.setFont("helvetica", "bold");
      pdf.text(`$${referencia.costoTotal.toFixed(2)} MXN`, rightCol, yPos);
      pdf.setFont("helvetica", "normal");
      yPos += 6;

      pdf.text("Fecha límite de pago:", leftCol, yPos);
      pdf.text(referencia.fechaValidacion, rightCol, yPos);
      yPos += 6;

      pdf.text("Días vigentes:", leftCol, yPos);
      pdf.text(`${referencia.diasVigentes} días`, rightCol, yPos);
      yPos += 6;

      pdf.text("Estado:", leftCol, yPos);
      pdf.text(referencia.estado, rightCol, yPos);

      // =========================
      // 📦 DATOS DEL ESTUDIANTE
      // =========================
      yPos = 155;
      pdf.rect(20, yPos - 10, pageWidth - 40, 35);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("DATOS DEL ESTUDIANTE", leftCol, yPos);
      yPos += 10;

      pdf.setFont("helvetica", "normal");
      pdf.text("Nombre:", leftCol, yPos);
      pdf.text(user?.nombre || "N/A", rightCol, yPos);
      yPos += 6;

      pdf.text("Matrícula:", leftCol, yPos);
      pdf.text(user?.matricula || "N/A", rightCol, yPos);
      yPos += 6;

      pdf.text("Correo:", leftCol, yPos);
      pdf.text(user?.correo || "N/A", rightCol, yPos);

      // =========================
      // 📋 INSTRUCCIONES
      // =========================
      yPos = 205;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("INSTRUCCIONES DE PAGO:", leftCol, yPos);
      yPos += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text("• Presente esta referencia en cualquier sucursal BBVA", leftCol, yPos); yPos += 5;
      pdf.text("• También puede pagar en línea en www.bbva.mx", leftCol, yPos); yPos += 5;
      pdf.text("• La referencia es válida hasta la fecha límite indicada", leftCol, yPos); yPos += 5;
      pdf.text("• Conserve su comprobante de pago", leftCol, yPos);

      // =========================
      // 📅 FOOTER
      // =========================
      const fechaGeneracion = new Date().toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });

      pdf.setFontSize(8);
      pdf.text(`Documento generado el ${fechaGeneracion}`, pageWidth / 2, pageHeight - 15, { align: "center" });

      // 👉 Nueva página si no es la última
      if (index < seleccionados.length - 1) {
        pdf.addPage();
      }
    });

    // Guardar archivo
    const fileName = `Referencias_${user?.matricula || "Alumno"}_${fechaActual.replace(/\//g, "-")}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error("Error al generar PDF:", error);
    alert("❌ Error al generar el PDF. Intenta nuevamente.");
  }
}



  // Función alternativa más simple para descargar PDF
  async descargarPDFSimple(): Promise<void> {
    try {
      const user = this.currentUser;
      const fechaActual = new Date().toLocaleDateString('es-ES');

      // Crear PDF directamente
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ESTADO DE CUENTA', 105, 20, { align: 'center' });

      // Info del alumno
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      let yPos = 40;
      
      pdf.text(`Alumno: ${user?.nombre || 'N/A'}`, 20, yPos);
      pdf.text(`Matrícula: ${user?.matricula || 'N/A'}`, 20, yPos + 10);
      pdf.text(`Fecha: ${fechaActual}`, 20, yPos + 20);
      
      // Estadísticas
      yPos += 35;
      pdf.text(`Pagos pendientes: ${this.pagosPendientes}`, 20, yPos);
      pdf.text(`Total: $${this.totalMonto.toFixed(2)}`, 120, yPos);

      // Tabla de datos
      yPos += 20;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      
      // Headers de tabla
      pdf.text('MOTIVO', 20, yPos);
      pdf.text('REFERENCIA', 80, yPos);
      pdf.text('FECHA', 130, yPos);
      pdf.text('COSTO', 170, yPos);
      
      // Línea separadora
      pdf.line(20, yPos + 2, 190, yPos + 2);
      
      // Datos de la tabla
      pdf.setFont('helvetica', 'normal');
      yPos += 10;
      
      this.datosTabla.forEach((item, index) => {
        if (yPos > 250) { // Nueva página si es necesario
          pdf.addPage();
          yPos = 30;
        }
        
        pdf.text(item.motivo.substring(0, 25), 20, yPos);
        pdf.text(item.referencia, 80, yPos);
        pdf.text(item.fechaValidacion, 130, yPos);
        pdf.text(`$${item.costoTotal.toFixed(2)}`, 170, yPos);
        
        yPos += 8;
      });

      // Descargar
      const fileName = `Estado_Cuenta_${user?.matricula || 'Alumno'}_${fechaActual.replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);
      
      alert('PDF descargado correctamente');

    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Intenta nuevamente.');
    }
  }

  // Función para descargar papeleta PNG
  async descargarPapeleta(): Promise<void> {
    console.log('Descargando papeleta PNG...');
    try {
      // Mostrar estado de carga
      const loadingEl = document.getElementById('loading');
      if (loadingEl) loadingEl.style.display = 'block';

      // Ocultar botones durante la captura
      this.hideElementsForCapture();

      // Esperar un momento para que se oculten los elementos
      await new Promise(resolve => setTimeout(resolve, 200));

      // Capturar solo la tabla
      const element = document.querySelector('.data-table') as HTMLElement;
      
      if (!element) {
        throw new Error('No se encontró la tabla para generar la imagen');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Mostrar elementos nuevamente
      this.showElementsAfterCapture();

      // Crear enlace de descarga
      const link = document.createElement('a');
      link.download = `Papeleta_${this.currentUser?.matricula || 'Alumno'}_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      
      // Descargar
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Ocultar loading
      if (loadingEl) loadingEl.style.display = 'none';

      alert('Imagen descargada correctamente');

    } catch (error) {
      console.error('Error al generar imagen:', error);
      
      // Mostrar elementos en caso de error
      this.showElementsAfterCapture();
      
      // Ocultar loading
      const loadingEl = document.getElementById('loading');
      if (loadingEl) loadingEl.style.display = 'none';
      
      alert('Error al generar la imagen. Intenta nuevamente.');
    }
  }

  // Función para cerrar modal
  cerrarModal(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const modal = document.getElementById('modalNuevoPago');
    if (modal) {
      modal.style.display = 'none';
    }
  }


  private transformarReferenciasParaTabla(referencias: any[]): any[] {
    console.log('🔄 Transformando referencias para tabla:', referencias);

      referencias.forEach((ref, index) => {
      console.log(`📊 Referencia ${index + 1}:`, {
        id: ref.id,
        descripcion: ref.descripcion,
        fecha_vencimiento: ref.fecha_vencimiento,
        fecha_generada: ref.fecha_generada,
        importe: ref.importe,
        estado: ref.estado
      });
    });
    
    return referencias.map(ref => ({
      id: ref.id,
      motivo: ref.descripcion || ref.concepto_nombre || 'Concepto sin descripción',
      referencia: ref.referencia_final || ref.referencia_completa,
      fechaValidacion: this.formatearFecha(ref.fecha_vencimiento),
      diasVigentes: this.calcularDiasVigentes(ref.fecha_vencimiento),
      costoTotal: parseFloat(ref.importe) || 0,
      estado: this.determinarEstado(ref),
      // Datos adicionales para uso interno
      fechaVencimientoOriginal: ref.fecha_vencimiento,
      fechaGeneracion: ref.fecha_generada,
      codigoPago: ref.codigo_pago,
      referenciaCompleta: ref.referencia_final || ref.referencia_completa
    }));
  }

  private determinarEstado(referencia: any): string {
    const hoy = new Date();
    const vencimiento = new Date(referencia.fecha_vencimiento);
    const diasRestantes = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    // Verificar si está pagada
    if (referencia.estado === 'Pagado' || referencia.pagado === true) {
      return 'Pagado';
    }
    
    // Verificar vencimiento
    if (diasRestantes < 0) {
      return 'Vencido';
    } else if (diasRestantes <= 3) {
      return 'Por Vencer';
    } else if (diasRestantes <= 7) {
      return 'Próximo a Vencer';
    } else {
      return 'Vigente';
    }
  }


  public recargarReferencias(): void {
    console.log('🔄 Recargando referencias manualmente...');
    this.loadPaymentData();
  }


/**
 * 📊 Obtener resumen de estados
 */
private obtenerResumenEstados(): { [key: string]: number } {
  const resumen: { [key: string]: number } = {
    'Vigente': 0,
    'Próximo a Vencer': 0,
    'Por Vencer': 0,
    'Vencido': 0,
    'Pagado': 0
  };

  
  this.datosTabla.forEach(item => {
    const estado = item.estado;
    
    // ✅ Verificación explícita de estados válidos
    if (estado && typeof estado === 'string' && resumen.hasOwnProperty(estado)) {
      resumen[estado]++;
    } else {
      // Manejar estados no reconocidos
      console.warn('⚠️ Estado no reconocido:', estado);
    }
  });

  return resumen;
}
   private calcularEstadisticasFinancieras(): any {
    const pendientes = this.datosTabla.filter(item => 
      item.estado !== 'Pagado' && item.estado !== 'Vencido'
    );

    const vencidos = this.datosTabla.filter(item => item.estado === 'Vencido');
    const pagados = this.datosTabla.filter(item => item.estado === 'Pagado');

    return {
      totalPendientes: pendientes.length,
      montoPendiente: pendientes.reduce((sum, item) => sum + item.costoTotal, 0),
      totalVencidos: vencidos.length,
      montoVencido: vencidos.reduce((sum, item) => sum + item.costoTotal, 0),
      totalPagados: pagados.length,
      montoPagado: pagados.reduce((sum, item) => sum + item.costoTotal, 0),
      montoTotal: this.datosTabla.reduce((sum, item) => sum + item.costoTotal, 0)
    };
  }



//Generar PDF individual de referencia (formato oficial BBVA)

async generarPDFReferenciaIndividual(referencia: any): Promise<void> {
  try {
    console.log('📄 Generando PDF individual para referencia:', referencia.referencia);
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // 🎨 COLORES BBVA
    const azulBBVA = [0, 77, 153]; // #004D99
    const grisBBVA = [102, 102, 102]; // #666666
    
    // 🏦 HEADER BANCARIO
    pdf.setFillColor(azulBBVA[0], azulBBVA[1], azulBBVA[2]);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BBVA', 20, 16);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Bancomer, S.A.', 50, 16);
    
    // 📋 INFORMACIÓN DEL CONVENIO
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Institución Bancaria:', 20, 40);
    pdf.setFont('helvetica', 'normal');
    pdf.text(this.BANCO_NOMBRE, 20, 50);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Convenio CIE:', 20, 65);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(16);
    pdf.text(this.CONVENIO_CIE, 55, 65);
    
    // 🏫 INSTITUCIÓN EDUCATIVA
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.INSTITUCION, pageWidth / 2, 80, { align: 'center' });
    
    // 📏 LÍNEA SEPARADORA
    pdf.setDrawColor(azulBBVA[0], azulBBVA[1], azulBBVA[2]);
    pdf.setLineWidth(1);
    pdf.line(20, 90, pageWidth - 20, 90);
    
    // 💰 TÍTULO DE REFERENCIA
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(azulBBVA[0], azulBBVA[1], azulBBVA[2]);
    pdf.text('REFERENCIA DE PAGO', pageWidth / 2, 110, { align: 'center' });
    
    // 🎫 REFERENCIA PRINCIPAL - MUY GRANDE Y VISIBLE
    pdf.setFontSize(24);
    pdf.setFont('courier', 'bold');
    pdf.setTextColor(0,0,0);
    
    // Dividir la referencia en grupos para mejor legibilidad
    // 🔢 FORMATO DE LA REFERENCIA (en bloques de 8, separados con espacio)
const ref = referencia.referencia;
const refFormateada = ref.match(/.{1,8}/g)?.join(' ') || ref;

// 📌 Mostrar la referencia centrada
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(16);
pdf.text('REFERENCIA DE PAGO', pageWidth / 2, 125, { align: 'center' });

pdf.setFontSize(14);
pdf.text(refFormateada, pageWidth / 2, 135, { align: 'center' });

// 📦 RECUADRO SOLO PARA DATOS DEL ESTUDIANTE
pdf.setDrawColor(0, 0, 0);
pdf.setLineWidth(0.5);
pdf.rect(20, 145, pageWidth - 40, 35); // más pequeño

let yPos = 155;
const leftCol = 30;
const rightCol = 120;

pdf.setFontSize(12);
pdf.setFont('helvetica', 'bold');
pdf.text('DATOS DEL ESTUDIANTE', leftCol, yPos);
yPos += 10;

pdf.setFont('helvetica', 'normal');
pdf.text(`Nombre:`, leftCol, yPos);
pdf.text(`${this.currentUser?.nombre || 'N/A'}`, rightCol, yPos);
yPos += 6;

pdf.text(`Matrícula:`, leftCol, yPos);
pdf.text(`${this.currentUser?.matricula || 'N/A'}`, rightCol, yPos);
yPos += 6;

pdf.text(`Correo:`, leftCol, yPos);
pdf.text(`${this.currentUser?.correo || 'N/A'}`, rightCol, yPos);

// 📦 RECUADRO PARA DATOS DEL PAGO
yPos += 20;
pdf.rect(20, yPos - 10, pageWidth - 40, 50);

pdf.setFont('helvetica', 'bold');
pdf.setFontSize(12);
pdf.text('DATOS DEL PAGO', leftCol, yPos);
yPos += 10;

pdf.setFont('helvetica', 'normal');
pdf.setFontSize(11);
pdf.text(`Concepto:`, leftCol, yPos);
pdf.text(`${referencia.motivo}`, rightCol, yPos);
yPos += 6;

pdf.text(`Importe:`, leftCol, yPos);
pdf.setFont('helvetica', 'bold');
pdf.text(`$${referencia.costoTotal.toFixed(2)} MXN`, rightCol, yPos);
pdf.setFont('helvetica', 'normal');
yPos += 6;

pdf.text(`Fecha límite de pago:`, leftCol, yPos);
pdf.text(`${referencia.fechaValidacion}`, rightCol, yPos);
yPos += 6;

pdf.text(`Días vigentes:`, leftCol, yPos);
pdf.text(`${referencia.diasVigentes} días`, rightCol, yPos);
yPos += 6;

pdf.text(`Estado:`, leftCol, yPos);
pdf.text(`${referencia.estado}`, rightCol, yPos);

// 📋 INSTRUCCIONES DE PAGO
yPos += 25;
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(10);
pdf.text('INSTRUCCIONES DE PAGO:', leftCol, yPos);
yPos += 8;

pdf.setFont('helvetica', 'normal');
pdf.setFontSize(9);
pdf.text('• Presente esta referencia en cualquier sucursal BBVA', leftCol, yPos); yPos += 5;
pdf.text('• La referencia es válida hasta la fecha límite indicada', leftCol, yPos); yPos += 5;
pdf.text('• Conserve su comprobante de pago', leftCol, yPos);

// 📅 FOOTER
const fechaGeneracion = new Date().toLocaleDateString('es-MX', {
  year: 'numeric',
  month: 'long', 
  day: 'numeric'
});
pdf.setFontSize(8);
pdf.text(`Documento generado el ${fechaGeneracion}`, pageWidth / 2, pageHeight - 20, { align: 'center' });

    
    pdf.setFontSize(8);
    pdf.setTextColor(grisBBVA[0], grisBBVA[1], grisBBVA[2]);
    pdf.text(`Documento generado el ${fechaGeneracion}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    pdf.text(`${this.INSTITUCION} - Orgullo y compromiso de la gente`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // 💾 DESCARGAR PDF
    const nombreArchivo = `Referencia_${referencia.referencia}_${this.currentUser?.matricula}.pdf`;
    pdf.save(nombreArchivo);
    
    console.log('✅ PDF generado exitosamente:', nombreArchivo);
    
  } catch (error) {
    console.error('❌ Error al generar PDF individual:', error);
    alert('Error al generar el PDF de la referencia');
  }
}




}