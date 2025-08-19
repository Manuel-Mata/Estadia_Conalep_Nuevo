  import { Component, OnInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
  import { CommonModule, isPlatformBrowser } from '@angular/common';
  import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
  import { Subject, takeUntil } from 'rxjs';

  import { PortalReferenciasService, AlumnoData, Carrera, Periodo, Semestre, Materia, Concepto } from '../../services/portal-referencias.service';
  import { ReferenceGeneratorService, ReferenciaGenerada } from '../../services/reference-generator.service';

  @Component({
    selector: 'app-portal-referencias',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './portal-alumno-referencias.component.html',
    styleUrls: ['./portal-alumno-referencias.component.css']
  })
  export class PortalAlumnoReferenciasComponent implements OnInit, OnDestroy {
    
    private destroy$ = new Subject<void>();
    private platformId = inject(PLATFORM_ID);

    // Formulario principal
    referenciaForm: FormGroup;
    
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
    referenciaGenerada: ReferenciaGenerada | null = null;
    tiempoActual = '';
    
    // Conceptos de pago
  // conceptosPago = [
    // { value: 'REINGRESO', label: 'Reingreso' },
      //{ value: 'REINSCRIPCION', label: 'Reinscripción' },  
      //{ value: 'CREDENCIAL', label: 'Credencial' },
      //{ value: 'ASESORIA_COMPLEMENTARIA', label: 'Asesoría Complementaria' }
    //];

    constructor(
      private fb: FormBuilder,
      private portalService: PortalReferenciasService,
      private referenceService: ReferenceGeneratorService
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
    }

    ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
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
      this.cargarMateriasPorTipoAsesoria(codigoPago);
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
private cargarMateriasPorTipoAsesoria(codigoPago: number): void {
  const formData = this.referenciaForm.value;
  
  // Verificar que tenemos los datos mínimos necesarios
  if (!this.alumnoData) {
    console.warn('❌ No hay datos del alumno para cargar materias');
    return;
  }

  // Para asesorías intersemestrales (código 4)
  if (codigoPago === 4) {
    if (!formData.carrera_id || !formData.periodo_id || !formData.semestre_id) {
      console.warn('❌ Faltan datos para asesorías intersemestrales:', {
        carrera_id: formData.carrera_id,
        periodo_id: formData.periodo_id, 
        semestre_id: formData.semestre_id
      });
      return;
    }

    console.log('🔄 Cargando materias intersemestrales con:', {
      carrera_id: formData.carrera_id,
      periodo_id: formData.periodo_id,
      semestre_id: formData.semestre_id
    });

    this.portalService.obtenerMateriasFiltradas(
      formData.carrera_id,
      formData.periodo_id,
      formData.semestre_id
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        console.log('📝 Respuesta completa API intersemestrales:', response);
        // AQUÍ ESTÁ EL PROBLEMA - Probablemente la respuesta venga en response.data
        this.materias = response.materias || response.data || response.results || [];
        console.log('📚 Materias intersemestrales procesadas:', this.materias);
      },
      error: (error) => {
        console.error('❌ Error al cargar materias intersemestrales:', error);
        this.materias = [];
      }
    });
  } 
  // Para asesorías semestrales (código 5)
  else if (codigoPago === 5) {
    if (!formData.semestre_id) {
      console.warn('❌ Falta semestre_id para asesorías semestrales:', formData.semestre_id);
      return;
    }

    console.log('🔄 Cargando materias semestrales con semestre_id:', formData.semestre_id);

    this.portalService.obtenerMateriasPorSemestre(formData.semestre_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('📝 Respuesta completa API semestrales:', response);
          // AQUÍ TAMBIÉN - Verificar la estructura de la respuesta
          this.materias = response.materias || response.data || response.results || [];
          console.log('📚 Materias semestrales procesadas:', this.materias);
        },
        error: (error) => {
          console.error('❌ Error al cargar materias semestrales:', error);
          this.materias = [];
        }
      });
  }
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
/**
 * 
 
  private configurarWatchers(): void {
  // Watch matrícula
  this.referenciaForm.get('matricula')?.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe((matricula: string) => {
      console.log('👤 Matrícula cambiada:', matricula);
      if (matricula && matricula.length >= 10) {
        this.buscarAlumno(matricula);
      } else {
        this.alumnoData = null;
        this.limpiarSelecciones();
      }
    });

    
/**      // Watch concepto
      this.referenciaForm.get('concepto')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((concepto: string) => {
          console.log('📋 Concepto cambiado:', concepto);
          this.mostrarMaterias = concepto === 'ASESORIA_SEMESTRALES';
          if (this.mostrarMaterias) {
            this.configurarValidacionesMaterias();
          } else {
            this.removerValidacionesMaterias();
          }
          this.materias = []; // ✅ Asegurar que sea array vacío
        });

*/

      
/**
      // Watch filtros para materias
      this.referenciaForm.get('periodo_id')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          console.log('📅 Período cambiado, filtrando materias...');
          this.obtenerMateriasFiltradas();
        });

      this.referenciaForm.get('semestre_id')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          console.log('📚 Semestre cambiado, filtrando materias...');
          this.obtenerMateriasFiltradas();
        });

      this.referenciaForm.get('carrera_id')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          console.log('🎓 Carrera cambiada, filtrando materias...');
          this.obtenerMateriasFiltradas();
        });
    }

    private buscarAlumno(matricula: string): void {
      console.log('🔍 Buscando alumno con matrícula:', matricula);
      this.isLoading = true;
      
      this.portalService.obtenerAlumnoPorMatricula(matricula)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            console.log('✅ Respuesta alumno completa:', response);
            
            // ✅ MANEJAR RESPUESTA DEL ALUMNO
            if (response && response.alumno) {
              this.alumnoData = response.alumno;
            } else if (response && response.id) {
              this.alumnoData = response;
            } else {
              console.warn('⚠️ Formato de respuesta de alumno inesperado:', response);
              this.alumnoData = null;
            }
            
            // Auto-llenar carrera y semestre del alumno
            if (this.alumnoData) {
              this.referenciaForm.patchValue({
                carrera_id: this.alumnoData.carrera_id,
                semestre_id: this.alumnoData.semestre_id
              });
            }
            this.isLoading = false;
          },
          error: (error: any) => {
            console.error('❌ Error al buscar alumno:', error);
            this.alumnoData = null;
            this.isLoading = false;
            this.mostrarError('Alumno no encontrado con esa matrícula');
          }
        });
    }

  /**
  private obtenerMateriasFiltradas(): void {
      if (!this.mostrarSelectorMaterias) return;

      const carrera_id = this.referenciaForm.get('carrera_id')?.value;
      const periodo_id = this.referenciaForm.get('periodo_id')?.value;
      const semestre_id = this.referenciaForm.get('semestre_id')?.value;

      console.log('🔍 Filtrando materias con:', { carrera_id, periodo_id, semestre_id });

      if (carrera_id && periodo_id && semestre_id) {
        this.portalService.obtenerMateriasFiltradas(carrera_id, periodo_id, semestre_id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response: any) => {
              console.log('✅ Respuesta materias completa:', response);
              
              // ✅ ASEGURAR QUE MATERIAS SEA UN ARRAY
              if (response && response.data && Array.isArray(response.data)) {
                this.materias = response.data;
              } else if (response && Array.isArray(response)) {
                this.materias = response;
              } else {
                console.warn('⚠️ Materias no es un array:', response);
                this.materias = [];
              }
              
              console.log('📊 Materias procesadas:', this.materias);
            },
            error: (error: any) => {
              console.error('❌ Error al filtrar materias:', error);
              this.materias = [];
            }
          });
      } else {
        this.materias = [];
      }
    }

  /*private filtrarMaterias(): void {
    if (!this.mostrarMaterias) return;
    
    const semestre_id = this.referenciaForm.get('semestre_id')?.value;
    
    if (semestre_id) {
      this.portalService.obtenerMateriasPorSemestre(semestre_id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.materias = this.ensureArray(response);
            console.log('📊 Materias cargadas:', this.materias);
          },
          error: (error: any) => {
            console.error('❌ Error:', error);
            this.materias = [];
          }
        });
    }
  }*/

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
      console.log('🎫 Generando referencia...');
      console.log('📝 Estado del formulario:', this.referenciaForm.value);
      console.log('✅ Formulario válido:', this.referenciaForm.valid);

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

  // Construir concepto para la referencia
    let conceptoFinal = codigoPagoSeleccionado.toString();
    let descripcionCompleta = '';
    let importeFinal = 0;

  // Buscar el concepto seleccionado en los datos de la BD
    const conceptoSeleccionado = this.conceptos.find(c => c.codigo_pago === codigoPagoSeleccionado);

    if (conceptoSeleccionado) {
      descripcionCompleta = conceptoSeleccionado.nombre;
      importeFinal = conceptoSeleccionado.importe;
      
      // Manejo especial para asesorías (códigos 4 y 5)
      if ((codigoPagoSeleccionado === 4 || codigoPagoSeleccionado === 5) && formData.materia_id) {
        const materia = this.materias.find(m => m.id == formData.materia_id);
        if (materia) {
          conceptoFinal = `${codigoPagoSeleccionado}_${materia.siglas}`;
          descripcionCompleta = `${conceptoSeleccionado.nombre} - ${materia.nombre}`;
        }
      }
    } else {
      console.warn('Concepto no encontrado:', codigoPagoSeleccionado);
      this.mostrarError('Concepto no válido seleccionado');
      this.isLoading = false;
      return;
    }

      // Datos para generar referencia
    const referenciaData = {
      concepto: conceptoFinal,
      fechaVencimiento: this.calcularFechaVencimiento(),
      importe: importeFinal, // Ahora viene directo de la BD
      variable: this.generarVariable(formData, codigoPagoSeleccionado),
      alumnoId: this.alumnoData.id,
      matricula: formData.matricula
    };

      console.log('📊 Datos para generar referencia:', referenciaData);

      try {
        // Generar referencia usando el servicio existente
        this.referenciaGenerada = this.referenceService.generarReferencia(referenciaData);
        
        // Agregar descripción completa
        if (this.referenciaGenerada) {
          this.referenciaGenerada.descripcion = descripcionCompleta;
        }

        console.log('✅ Referencia generada:', this.referenciaGenerada);

        // Guardar en BD con información adicional
  if (this.alumnoData?.id) {
        const datosCompletos = {
          ...this.referenciaGenerada,
          carrera_id: formData.carrera_id || this.alumnoData.carrera_id,
          periodo_id: formData.periodo_id,
          semestre_id: formData.semestre_id || this.alumnoData.semestre_id,
          materia_id: formData.materia_id || null,
          descripcion: descripcionCompleta,
          codigo_pago: codigoPagoSeleccionado
        };

        this.referenceService.guardarReferencia(datosCompletos, this.alumnoData.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response: any) => {
              console.log('✅ Referencia guardada:', response);
              this.mostrarExito('¡Referencia generada y guardada exitosamente!');
              this.isLoading = false;
            },
            error: (error: any) => {
              console.error('❌ Error al guardar referencia:', error);
              this.mostrarError('Referencia generada pero hubo un error al guardar en la base de datos');
              this.isLoading = false;
            }
          });
      } else {
        this.mostrarExito('¡Referencia generada exitosamente!');
        this.isLoading = false;
      }

    } catch (error) {
      console.error('❌ Error al generar referencia:', error);
      this.mostrarError('Error al generar la referencia. Verifica los datos e intenta nuevamente.');
      this.isLoading = false;
    }
  }



    private calcularFechaVencimiento(): string {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + 30);
      return fecha.toISOString().split('T')[0];
    }

  /**
    private calcularImporte(concepto: string): number {
      const importes: { [key: string]: number } = {
        'REINGRESO': 500.00,
        'REINSCRIPCION': 300.00,
        'CREDENCIAL': 150.00,
        'ASESORIA_COMPLEMENTARIA': 250.00
      };
      return importes[concepto] || 100.00;
    }
    */


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
