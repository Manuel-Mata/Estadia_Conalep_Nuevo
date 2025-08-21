  import { Component, OnInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
  import { CommonModule, isPlatformBrowser } from '@angular/common';
  import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
  import { Subject, takeUntil } from 'rxjs';

  import { PortalReferenciasService, AlumnoData, Carrera, Periodo, Semestre, Materia, Concepto } from '../../services/portal-referencias.service';
  //  import { ReferenceGeneratorService, ReferenciaGenerada } from '../../services/reference-generator.service';
  //import { GeneradorReferenciaVbaService } from '../../services/generador-referencia-vba.service'; 
  //import { DatosReferenciaVBA } from '../../services/generador-referencia-vba.service';
import { GeneradorReferenciaVbaService, DatosReferenciaVBA, ReferenciaCompleta } from '../../services/generador-referencia-vba.service';

  @Component({
    selector: 'app-portal-referencias',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './portal-alumno-referencias.component.html',
    styleUrls: ['./portal-alumno-referencias.component.css']
  })
  export class PortalAlumnoReferenciasComponent implements OnInit, OnDestroy {

    referenciaGenerada: ReferenciaCompleta | null = null;
    private destroy$ = new Subject<void>();
    private platformId = inject(PLATFORM_ID);
    // Formulario principal
    referenciaForm: FormGroup;
    horaActual = new Date();
    mostrarMaterias = false;

    // ✅ INICIALIZAR ARRAYS VACÍOS PARA EVITAR ERROR NgFor
    alumnoData: AlumnoData | null = null;
    carreras: Carrera[] = [];
    periodos: Periodo[] = [];
    semestres: Semestre[] = [];
    materias: Materia[] = [];
    conceptos: Concepto[] = [];
    mostrarSelectorMaterias: boolean = false;
    //mostrarSelectorMaterias: boolean = false;
    
    // Estados del componente
    isLoading = false;
    //mostrarMaterias = false;
    
    tiempoActual = '';
    


    

    constructor(
      private fb: FormBuilder,
      private portalService: PortalReferenciasService,
      //private referenceService: ReferenceGeneratorService,
      private generadorVBA: GeneradorReferenciaVbaService
    ) {
      this.referenciaForm = this.fb.group({
        matricula: ['', [Validators.required, Validators.minLength(6)]],
        concepto: ['', Validators.required],
        periodo_id: [''],
        semestre_id: [''],
        carrera_id: [''],
        materia_id: ['']
      });
    }

    ngOnInit(): void {
      console.log('🚀 Iniciando componente Portal Referencias');
      this.cargarDatosIniciales();
      //this.configurarWatchers();
      this.actualizarReloj();
      //this.cargarConceptos();
      this.cargarConceptos();
      this.setupFormWatchers();
      this.probarAlgoritmo(); // Llamar al método de prueba del servicio
      this.setupFormWatchers();
      this.actualizarReloj();
    }

    ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
    }

calcularUltimoDiaPago(): string {
  if (!this.referenciaGenerada?.fechaVencimiento) return '';
  
  const [dd, mm, yyyy] = this.referenciaGenerada.fechaVencimiento.split('/');
  const fechaVencimiento = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
  fechaVencimiento.setDate(fechaVencimiento.getDate() - 3);
  
  return fechaVencimiento.toLocaleDateString('es-MX');
}




  private cargarConceptos(): void {
    this.portalService.obtenerConceptos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conceptos: Concepto[]) => {
          this.conceptos = conceptos;
          console.log('📊 Conceptos cargados desde BD:', this.conceptos);
        },
        error: (error) => {
          console.error('❌ Error al cargar conceptos:', error);
          this.conceptos = [];
          this.mostrarError('Error al cargar los conceptos disponibles');
        }
      });
  }

  // Agregar este método en tu componente
private probarAlgoritmo(): void {
  console.log('🧪 === INICIANDO PRUEBA DEL ALGORITMO VBA ===');
  
  try {
    // Llamar al método de prueba del servicio
    const resultado = this.generadorVBA.pruebaCompleta();
    
    console.log('✅ Prueba completada exitosamente');
    console.log('📊 Resultado:', resultado);
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

  private setupFormWatchers(): void {
    this.referenciaForm.get('concepto')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(codigoPago => {
        this.manejarCambioConcepto(parseInt(codigoPago));
      });
  }

  private manejarCambioConcepto(codigoPago: number): void {
    // Códigos para asesorías (intersemestrales: 4, semestrales: 5)
    const esAsesoriaIntersemestral = codigoPago === 4;
    const eseAsorSemestral = codigoPago === 5;
    const esAsesoria = esAsesoriaIntersemestral || eseAsorSemestral;

    if (esAsesoria) {
      this.activarSelectorMaterias();
      this.cargarMateriasPorTipoAsesoria();
    } else {
      this.desactivarSelectorMaterias();
    }
  }

  private activarSelectorMaterias(): void {
    const materiaControl = this.referenciaForm.get('materia_id');
    if (materiaControl) {
      materiaControl.setValidators([Validators.required]);
      materiaControl.updateValueAndValidity();
      this.mostrarSelectorMaterias = true;
    }
  }


  private desactivarSelectorMaterias(): void {
    const materiaControl = this.referenciaForm.get('materia_id');
    if (materiaControl) {
      materiaControl.clearValidators();
      materiaControl.setValue(null);
      materiaControl.updateValueAndValidity();
      this.mostrarSelectorMaterias = false;
    }
    this.materias = [];
  }





  


  
// PASO 1: Primero, limpia tu método cargarMateriasPorTipoAsesoria
private cargarMateriasPorTipoAsesoria(): void {
  const formData = this.referenciaForm.value;
  const semestreId = formData.semestre_id || this.alumnoData?.semestre_id;
  const carreraId = formData.carrera_id || this.alumnoData?.carrera_id;

  if (!semestreId) {
    console.warn('⚠️ Falta semestre para cargar materias');
    this.materias = [];
    return;
  }

  const codigoConcepto = parseInt(formData.concepto);

  if (codigoConcepto === 5) {
    // ✅ ASESORÍAS SEMESTRALES (código 5)
    console.log('🔄 Cargando materias semestrales con semestre_id:', semestreId);
    this.cargarMateriasConSemestre(semestreId);
    
  } else if (codigoConcepto === 4) {
    // ✅ ASESORÍAS INTERSEMESTRALES (código 4) - USAR MISMO MÉTODO
    console.log('🔄 Cargando materias intersemestrales con semestre_id:', semestreId);
    console.log('📅 Nota: Usando mismo endpoint que semestrales');
    
    // 🎯 USAR EL MISMO MÉTODO QUE FUNCIONA:
    this.cargarMateriasConSemestre(semestreId);
  }
}





private cargarMateriasConSemestre(semestreId: number): void {
  this.portalService.obtenerMateriasPorSemestre(semestreId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        console.log('📝 Respuesta completa API semestrales:', response);
        
        if (response && response.data && Array.isArray(response.data)) {
          this.materias = response.data;
          console.log('📚 Materias semestrales procesadas:', this.materias);
        } else {
          console.warn('⚠️ Respuesta inesperada semestrales:', response);
          this.materias = [];
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar materias semestrales:', error);
        this.materias = [];
      }
    });
}

    






    private cargarDatosIniciales(): void {
      console.log('📊 Cargando datos iniciales...');

      
      
      // CARGAR CARRERAS CON VALIDACIÓN DE ARRAY ADEMAS DE ACTIVARSE UN FILTRO AUTOMATICAMENTE
    this.portalService.obtenerCarreras()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta carreras completa:', response);
        
        //Verificar response.data en lugar de response.carreras
        if (response && response.data && Array.isArray(response.data)) {
          this.carreras = response.data;
        } else if (Array.isArray(response)) {
          this.carreras = response;
        } else {
          console.warn('⚠️ Carreras no es un array:', response);
          this.carreras = [];
        }
        
        console.log('📊 Carreras procesadas:', this.carreras);
      },
      error: (error: any) => {
        console.error('❌ Error al cargar carreras:', error);
        this.carreras = [];
      }
    });

    


    

  this.portalService.obtenerConceptos()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (conceptos: Concepto[]) => {
        this.conceptos = conceptos;
        console.log('📊 Conceptos procesados:', this.conceptos);
      },
      error: (error) => {
        console.error('❌ Error al cargar conceptos:', error);
        this.conceptos = [];
      }
    });





      // ✅ CARGAR PERÍODOS CON VALIDACIÓN DE ARRAY
      this.portalService.obtenerPeriodos()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            console.log('✅ Respuesta períodos completa:', response);
            
            // ✅ ASEGURAR QUE SEA UN ARRAY
            if (response && response.periodos && Array.isArray(response.periodos)) {
              this.periodos = response.periodos;
            } else if (response && Array.isArray(response)) {
              this.periodos = response;
            } else {
              console.warn('⚠️ Períodos no es un array:', response);
              this.periodos = [];
            }
            
            console.log('📊 Períodos procesados:', this.periodos);
          },
          error: (error: any) => {
            console.error('❌ Error al cargar períodos:', error);
            this.periodos = [];
          }
        });

      // ✅ CARGAR SEMESTRES CON VALIDACIÓN DE ARRAY
      this.portalService.obtenerSemestres()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            console.log('✅ Respuesta semestres completa:', response);
            
            // ✅ ASEGURAR QUE SEA UN ARRAY
            if (response && response.data && Array.isArray(response.data)) {
              this.semestres = response.data;
            } else if (response && Array.isArray(response)) {
              this.semestres = response;
            } else {
              console.warn('⚠️ Semestres no es un array:', response);
              this.semestres = [];
            }
            
            console.log('📊 Semestres procesados:', this.semestres);
          },
          error: (error: any) => {
            console.error('❌ Error al cargar semestres:', error);
            this.semestres = [];
          }
        });
    }
    
  buscarAlumno(): void {
  const matricula = this.referenciaForm.get('matricula')?.value;
  
  if (!matricula || matricula.length < 8) {
    return;
  }

  console.log('🔍 Buscando alumno con matrícula:', matricula);
  
  this.portalService.obtenerAlumnoPorMatricula(matricula)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (alumno) => {
        this.alumnoData = alumno;
        console.log('✅ Alumno encontrado:', this.alumnoData);
        
        // Pre-llenar campos si tiene datos
        if (this.alumnoData?.carrera_id) {
          this.referenciaForm.patchValue({
            carrera_id: this.alumnoData.carrera_id
          });
        }
        
        if (this.alumnoData?.semestre_id) {
          this.referenciaForm.patchValue({
            semestre_id: this.alumnoData.semestre_id
          });
        }
      },
      error: (error) => {
        console.error('❌ Error al buscar alumno:', error);
        this.alumnoData = null;
        this.mostrarError('Alumno no encontrado con esa matrícula');
      }
    });
}

onConceptoChange(): void {
  const concepto = this.referenciaForm.get('concepto')?.value;
  const codigoConcepto = parseInt(concepto);
  
  console.log('🎯 Concepto seleccionado:', codigoConcepto);
  
  this.mostrarMaterias = (codigoConcepto === 4 || codigoConcepto === 5);
  
  if (this.mostrarMaterias) {
    // ✅ AGREGAR ESTA LÍNEA QUE FALTA:
    this.cargarMateriasPorTipoAsesoria();
  } else {
    // ✅ LIMPIAR MATERIAS SI NO ES ASESORÍA:
    this.materias = [];
    this.referenciaForm.patchValue({
      materia_id: null
    });
  }
}







    private configurarValidacionesMaterias(): void {
      this.referenciaForm.get('periodo_id')?.setValidators([Validators.required]);
      this.referenciaForm.get('semestre_id')?.setValidators([Validators.required]);
      this.referenciaForm.get('carrera_id')?.setValidators([Validators.required]);
      this.referenciaForm.get('materia_id')?.setValidators([Validators.required]);
      
      this.referenciaForm.get('periodo_id')?.updateValueAndValidity();
      this.referenciaForm.get('semestre_id')?.updateValueAndValidity();
      this.referenciaForm.get('carrera_id')?.updateValueAndValidity();
      this.referenciaForm.get('materia_id')?.updateValueAndValidity();
    }

    private removerValidacionesMaterias(): void {
      this.referenciaForm.get('periodo_id')?.clearValidators();
      this.referenciaForm.get('semestre_id')?.clearValidators();
      this.referenciaForm.get('carrera_id')?.clearValidators();
      this.referenciaForm.get('materia_id')?.clearValidators();
      
      this.referenciaForm.get('periodo_id')?.updateValueAndValidity();
      this.referenciaForm.get('semestre_id')?.updateValueAndValidity();
      this.referenciaForm.get('carrera_id')?.updateValueAndValidity();
      this.referenciaForm.get('materia_id')?.updateValueAndValidity();
    }

    private limpiarSelecciones(): void {
      this.referenciaForm.patchValue({
        carrera_id: '',
        semestre_id: '',
        periodo_id: '',
        materia_id: ''
      });
      this.materias = []; // ✅ Asegurar que sea array vacío
    }

    // ✅ MÉTODO AUXILIAR PARA VERIFICAR SI ES ARRAY
    private ensureArray(data: any): any[] {
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object') {
        // Si es un objeto, intentar extraer arrays comunes
        return data.data || data.results || data.items || [];
      } else {
        return [];
      }
    }

    // Método principal para generar referencia
generarReferencia(): void {
  console.log('🎫 Generando referencia con algoritmo VBA...');

  if (this.referenciaForm.invalid) {
    this.marcarCamposComoTocados();
    this.mostrarError('Por favor completa todos los campos requeridos');
    return;
  }

  if (!this.alumnoData) {
    this.mostrarError('Primero debes ingresar una matrícula válida');
    return;
  }

  this.isLoading = true;
  const formData = this.referenciaForm.value;
  const codigoPagoSeleccionado = parseInt(formData.concepto);

  const conceptoSeleccionado = this.conceptos.find(c => c.codigo_pago === codigoPagoSeleccionado);

  if (!conceptoSeleccionado) {
    this.mostrarError('Concepto no válido seleccionado');
    this.isLoading = false;
    return;
  }

  try {
    // 🎯 DETECTAR SI ES CONCEPTO DE ASESORÍA
    const esAsesoria = (codigoPagoSeleccionado === 4 || codigoPagoSeleccionado === 5);
    
    // 🎯 PREPARAR DATOS PARA ALGORITMO VBA
    const datosVBA: DatosReferenciaVBA = {
      concepto: codigoPagoSeleccionado.toString().padStart(2, '0'),
      fecha: this.calcularFechaVencimiento(),
      importe: conceptoSeleccionado.importe,
      variable: '0',
      matricula: this.alumnoData.matricula
    };

    // ✅ AGREGAR SIGLAS DE MATERIA O PERÍODO SEGÚN CORRESPONDA
    if (esAsesoria && formData.materia_id) {
      // 📚 Para asesorías: buscar siglas de la materia seleccionada
      const materiaSeleccionada = this.materias.find(m => m.id == formData.materia_id);
      if (materiaSeleccionada && materiaSeleccionada.siglas) {
        datosVBA.siglas_materia = materiaSeleccionada.siglas;
        console.log('📚 Usando siglas de materia:', materiaSeleccionada.siglas);
      } else {
        this.mostrarError('Debe seleccionar una materia válida para asesorías');
        this.isLoading = false;
        return;
      }
    } else if (esAsesoria && !formData.materia_id) {
      this.mostrarError('Debe seleccionar una materia para conceptos de asesoría');
      this.isLoading = false;
      return;
    } else {
      // 📅 Para conceptos normales: usar período automático
      datosVBA.periodo = this.calcularPeriodoAutomatico();
      console.log('📅 Usando período automático:', datosVBA.periodo);
    }

    console.log('📊 Datos finales para algoritmo VBA:', datosVBA);

    // 🚀 GENERAR CON ALGORITMO VBA
    const referenciaVBA = this.generadorVBA.generarReferencia(datosVBA);
    
    // 📋 CONSTRUIR REFERENCIA COMPLETA
    this.referenciaGenerada = {
      referenciaCompleta: referenciaVBA.referenciaCompleta,
      referenciaBase: referenciaVBA.referenciaBase,
      digitoVerificador: referenciaVBA.digitoVerificador,
      fechaCondensada: referenciaVBA.fechaCondensada,
      importeCondensado: referenciaVBA.importeCondensado,
      
      referencia: referenciaVBA.referenciaCompleta,
      concepto: codigoPagoSeleccionado.toString(),
      descripcion: conceptoSeleccionado.nombre,
      fechaVencimiento: this.calcularFechaVencimiento(),
      importe: conceptoSeleccionado.importe,
      fechaGeneracion: new Date().toISOString().split('T')[0],
      diasVigentes: 18,
      estado: 'Vigente',
      
      alumno_id: this.alumnoData.id,
      concepto_id: conceptoSeleccionado.id,
      codigo_pago: codigoPagoSeleccionado
    };

    console.log('✅ Referencia generada:', this.referenciaGenerada);
    this.guardarReferenciaEnBD();

  } catch (error) {
    console.error('❌ Error:', error);
    this.mostrarError('Error al generar la referencia');
    this.isLoading = false;
  }
}


private calcularPeriodoAutomatico(): string {
  const hoy = new Date();
  const mes = hoy.getMonth() + 1; // 1-12
  const año = hoy.getFullYear();
  
  if (mes >= 2 && mes <= 7) {
    return `FEBJUL${año.toString().slice(-2)}`;
  } else {
    return `AGODIC${año.toString().slice(-2)}`;
  }
}



private calcularFechaVencimiento(): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 18); // ✅ 18 días = 15 días efectivos
  
  const dd = fecha.getDate().toString().padStart(2, '0');
  const mm = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = fecha.getFullYear();
  
  return `${dd}/${mm}/${yyyy}`;
}

private guardarReferenciaEnBD(): void {
    if (!this.alumnoData?.id || !this.referenciaGenerada) return;

    const formData = this.referenciaForm.value;
    
    const datosCompletos: ReferenciaCompleta = {
      ...this.referenciaGenerada,
      referencia: this.referenciaGenerada.referenciaCompleta, // ✅ Compatibilidad
      carrera_id: formData.carrera_id || this.alumnoData.carrera_id,
      periodo_id: formData.periodo_id,
      semestre_id: formData.semestre_id || this.alumnoData.semestre_id,
      materia_id: formData.materia_id || null
    };

    // ✅ USAR el nuevo servicio:
    this.generadorVBA.guardarReferencia(datosCompletos, this.alumnoData.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('✅ Referencia guardada:', response);
          this.mostrarExito('¡Referencia generada y guardada exitosamente!');
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('❌ Error al guardar referencia:', error);
          this.mostrarError('Referencia generada pero hubo un error al guardar');
          this.isLoading = false;
        }
      });
  }

    private generarVariable(formData: any, codigoPago: number): string {
      // Para asesorías (códigos 4 y 5)
      if ((codigoPago === 4 || codigoPago === 5) && formData.materia_id) {
        return `${formData.materia_id}`.padStart(3, '0');
      }
      return '001';
    }

    private marcarCamposComoTocados(): void {
      Object.keys(this.referenciaForm.controls).forEach(key => {
        this.referenciaForm.get(key)?.markAsTouched();
      });
    }

    private actualizarReloj(): void {
      if (isPlatformBrowser(this.platformId)) {
        const actualizar = () => {
          const ahora = new Date();
          this.tiempoActual = ahora.toLocaleTimeString('es-ES');
        };
        
        actualizar();
        setInterval(actualizar, 1000);
      }
    }

    // Métodos de utilidad
    private mostrarError(mensaje: string): void {
      if (isPlatformBrowser(this.platformId)) {
        alert(`❌ ${mensaje}`);
      }
      console.error('Error:', mensaje);
    }

    private mostrarExito(mensaje: string): void {
      if (isPlatformBrowser(this.platformId)) {
        alert(`✅ ${mensaje}`);
      }
      console.log('Éxito:', mensaje);
    }

    // Getters para el template
    get mostrarDatosAlumno(): boolean {
      return !!this.alumnoData;
    }

    get nombreCarrera(): string {
      if (!this.alumnoData?.carrera_id) return '';
      const carrera = this.carreras.find(c => c.id === this.alumnoData?.carrera_id);
      return carrera?.nombre || '';
    }

  get numeroSemestre(): number {
    if (!this.alumnoData?.semestre_id || !this.semestres?.length) return 0;
    
    const semestre = this.semestres.find(s => s.id === this.alumnoData?.semestre_id);
    return semestre?.numero || 0;
  }

    // Método para copiar referencia
    copiarReferencia(): void {
      if (!this.referenciaGenerada?.referencia) return;

      if (isPlatformBrowser(this.platformId)) {
        navigator.clipboard.writeText(this.referenciaGenerada.referencia)
          .then(() => {
            this.mostrarExito('Referencia copiada al portapapeles');
          })
          .catch(() => {
            // Fallback para navegadores que no soportan clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = this.referenciaGenerada!.referencia;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
              document.execCommand('copy');
              this.mostrarExito('Referencia copiada al portapapeles');
            } catch (err) {
              this.mostrarError('Error al copiar referencia');
            }
            document.body.removeChild(textArea);
          });
      }
    }

    // Método para regresar
    regresar(): void {
      window.history.back();
    }

    // Método para descargar PDF
    descargarPDF(): void {
      if (!this.referenciaGenerada) {
        this.mostrarError('Primero debes generar una referencia');
        return;
      }
      
      console.log('📄 Descargando PDF de referencia:', this.referenciaGenerada);
      // TODO: Implementar descarga PDF con jsPDF
      this.mostrarError('Función de descarga PDF en desarrollo');
    }

    // Método para descargar PNG
    descargarPNG(): void {
      if (!this.referenciaGenerada) {
        this.mostrarError('Primero debes generar una referencia');
        return;
      }
      
      console.log('🖼️ Descargando PNG de referencia:', this.referenciaGenerada);
      // TODO: Implementar descarga PNG con html2canvas
      this.mostrarError('Función de descarga PNG en desarrollo');
    }
  }
