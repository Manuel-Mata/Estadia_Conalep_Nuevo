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
  
  // Datos del alumno
  currentUser: any = null;
  alumnoActualizado : any = null;
  pagosPendientes = 0;
  totalMonto = 0;
  datosTabla: any[] = [];
  datosOriginales: any[] = [];

  mostrarNotificacionCambio = false;
  cambiosDetectados : string[]= [];

  constructor(
    private authService: AuthService,
    private portalService : PortalReferenciasService,
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
    this.loadPaymentData();

    // Inicializar reloj
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);

    // Exponer funciones al contexto global para que el HTML pueda llamarlas
    this.exposeGlobalFunctions();
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
    // Esta función se puede usar si quieres mostrar una notificación más elegante
    // en lugar del alert básico
    console.log('📢 Mostrando notificación de cambios en HTML');
    
    // Aquí puedes agregar lógica para mostrar un toast o modal elegante
    // Por ejemplo, cambiar una propiedad que controle un div en el template
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

    if (this.datosTabla.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay datos disponibles</td></tr>';
      return;
    }

    tableBody.innerHTML = this.datosTabla.map(item => `
      <tr class="${item.estado.toLowerCase()}">
        <td>${item.motivo}</td>
        <td>${item.referencia}</td>
        <td>${item.fechaValidacion}</td>
        <td>${item.diasVigentes}</td>
        <td>$${item.costoTotal.toFixed(2)}</td>
      </tr>
    `).join('');
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
    console.log('Descargando PDF...');
    try {
      // Mostrar estado de carga
      const loadingEl = document.getElementById('loading');
      if (loadingEl) loadingEl.style.display = 'block';

      // Ocultar botones durante la captura
      this.hideElementsForCapture();

      // Esperar un momento para que se oculten los elementos
      await new Promise(resolve => setTimeout(resolve, 200));

      // Capturar la tabla y datos
      const element = document.querySelector('.main-content') as HTMLElement;
      
      if (!element) {
        throw new Error('No se encontró el contenido para generar el PDF');
      }

      const canvas = await html2canvas(element, {
        scale: 2, // Mayor calidad
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        height: element.scrollHeight,
        width: element.scrollWidth
      });

      // Mostrar elementos nuevamente
      this.showElementsAfterCapture();

      // Crear PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Dimensiones de la página A4
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calcular dimensiones de la imagen
      const imgWidth = pageWidth - 20; // Margen de 10mm a cada lado
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Información del alumno
      const user = this.currentUser;
      const fechaActual = new Date().toLocaleDateString('es-ES');

      // Header del PDF
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PORTAL DEL ALUMNO - ESTADO DE CUENTA', pageWidth / 2, 20, { align: 'center' });

      // Información del alumno
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Alumno: ${user?.nombre || 'N/A'}`, 15, 35);
      pdf.text(`Matrícula: ${user?.matricula || 'N/A'}`, 15, 45);
      pdf.text(`Correo: ${user?.correo || 'N/A'}`, 15, 55);
      pdf.text(`Fecha de generación: ${fechaActual}`, 15, 65);

      // Estadísticas
      pdf.text(`Pagos pendientes: ${this.pagosPendientes}`, 15, 80);
      pdf.text(`Total monto: $${this.totalMonto.toFixed(2)}`, 100, 80);

      // Línea separadora
      pdf.line(15, 85, pageWidth - 15, 85);

      // Agregar la imagen capturada
      let yPosition = 95;
      
      if (imgHeight <= pageHeight - yPosition - 20) {
        // Si cabe en una página
        pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
      } else {
        // Si necesita múltiples páginas
        let remainingHeight = imgHeight;
        let sourceY = 0;
        
        while (remainingHeight > 0) {
          const pageAvailableHeight = pageHeight - yPosition - 20;
          const sliceHeight = Math.min(remainingHeight, pageAvailableHeight);
          
          // Calcular la proporción del slice
          const sliceRatio = sliceHeight / imgHeight;
          const sourceHeight = canvas.height * sliceRatio;
          
          // Crear canvas temporal para este slice
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = sourceHeight;
          const tempCtx = tempCanvas.getContext('2d');
          
          if (tempCtx) {
            tempCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
            const sliceImgData = tempCanvas.toDataURL('image/png');
            pdf.addImage(sliceImgData, 'PNG', 10, yPosition, imgWidth, sliceHeight);
          }
          
          remainingHeight -= sliceHeight;
          sourceY += sourceHeight;
          
          if (remainingHeight > 0) {
            pdf.addPage();
            yPosition = 20;
          }
        }
      }

      // Footer en la última página
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - 30, pageHeight - 10);
        pdf.text('Generado por Portal del Alumno', 15, pageHeight - 10);
      }

      // Generar nombre del archivo
      const fileName = `Estado_Cuenta_${user?.matricula || 'Alumno'}_${fechaActual.replace(/\//g, '-')}.pdf`;

      // Descargar el PDF
      pdf.save(fileName);

      // Ocultar loading
      if (loadingEl) loadingEl.style.display = 'none';

      // Mostrar mensaje de éxito
      alert('PDF descargado correctamente');

    } catch (error) {
      console.error('Error al generar PDF:', error);
      
      // Mostrar elementos en caso de error
      this.showElementsAfterCapture();
      
      // Ocultar loading
      const loadingEl = document.getElementById('loading');
      if (loadingEl) loadingEl.style.display = 'none';
      
      alert('Error al generar el PDF. Intenta nuevamente.');
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
}