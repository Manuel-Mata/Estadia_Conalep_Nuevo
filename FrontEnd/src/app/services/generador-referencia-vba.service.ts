import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';



export interface DatosReferenciaVBA {
  concepto: string;
  fecha: string;
  importe: number;
  variable: string;
  matricula: string;
  año?: number;
  periodo?: string;
  siglas_materia?: string;
}

export interface ReferenciaGenerada{
  referenciaCompleta: string;
  referenciaBase: string;
  digitoVerificador: string;
  fechaCondensada: string;
  importeCondensado: string;

}


export interface ReferenciaCompleta extends ReferenciaGenerada {
  // Datos del VBA
  referenciaCompleta: string;
  referenciaBase: string;
  digitoVerificador: string;
  fechaCondensada: string;
  importeCondensado: string;
  id?: number;
  referencia: string;
  concepto: string;
  descripcion?: string;
  fechaVencimiento: string;
  importe: number;
  fechaGeneracion: string;
  diasVigentes: number;
  estado: string;
  pagado?: boolean;
  fechaPago?: string;
  metodoPago?: string;
  
  // Datos adicionales
  alumno_id?: number;
  concepto_id?: number;
  codigo_pago?: number;
  carrera_id?: number;
  periodo_id?: number;
  semestre_id?: number;
  materia_id?: number;
  observaciones?: string;
}



@Injectable({
  providedIn: 'root'
})





export class GeneradorReferenciaVbaService {
  private readonly VALORES_IMPORTE = [7,3,1];
  private readonly VALORES_REFERENCIA = [11,13,17,19,23];
  private readonly CODIGO_PLANTEL = 2716;
  private readonly ANIO_BASE = 2014;
  private readonly BASE_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { // ✅ AGREGAR HttpClient
    console.log('Gerador Referencia VBA Service Initialized');
  }

  //Este metodo es el encargado de calcular el periodo basado en la fecha
  //Si no se pasa una fecha, se usa la fecha actual
  //En este caso si el mes es entre febrero y julio, se usa el periodo FEBJUL
  //Si es entre agosto y enero, se usa AGODIC
 // En calcularPeriodo(), verifica que uses la fecha correctamente:
private calcularPeriodo(fecha?: string): string {
  console.log('📅 Calculando período para fecha:', fecha);
  
  // ✅ PROBLEMA: formato de fecha
  // Tu método espera dd/mm/yyyy pero quizás estás pasando yyyy/mm/dd
  
  let fechaObj: Date;
  if (fecha) {
    // ✅ Asegurar formato correcto dd/mm/yyyy
    const partes = fecha.split('/');
    if (partes.length === 3) {
      const dd = parseInt(partes[0]);
      const mm = parseInt(partes[1]) - 1; // Los meses en Date van de 0-11
      const yyyy = parseInt(partes[2]);
      fechaObj = new Date(yyyy, mm, dd);
    } else {
      fechaObj = new Date(fecha);
    }
  } else {
    fechaObj = new Date();
  }
  
  const año = fechaObj.getFullYear();
  const mes = fechaObj.getMonth() + 1; // Convertir de 0-11 a 1-12
  
  console.log('Fecha procesada - Año:', año, 'Mes:', mes);
  
  if (mes >= 2 && mes <= 7) {
    return `FEBJUL${año.toString().slice(-2)}`;
  } else {
    return `AGODIC${año.toString().slice(-2)}`;
  }
}


public probarPeriodos(): void {
  console.log('🧪 === PRUEBAS DE PERÍODOS ===');
  
  // Pruebas con diferentes fechas
  console.log('Marzo 2025:', this.calcularPeriodo('15/03/2025'));
  console.log('Septiembre 2025:', this.calcularPeriodo('20/09/2025'));
  console.log('Febrero 2026:', this.calcularPeriodo('10/02/2026'));
  console.log('Diciembre 2026:', this.calcularPeriodo('25/12/2026'));
  console.log('Sin fecha (hoy):', this.calcularPeriodo());
  
  console.log('✅ Pruebas completadas');
}


//Metodo para procesar la fecha y devolverla en el formato requerido por el algoritmo VBA
//Recibe una fecha en formato 'AAAA/MM/DD' y devuelve un string con el formato 'AAAA/MM/DD'
// Ejemplo: '2023/10/05' -> '2023/10/05'
private procesarFecha(fecha: string): string {
  const partes = fecha.split('/');
  const dd = parseInt(partes[0]);    // día
  const mm = parseInt(partes[1]);    // mes  
  const aaaa = parseInt(partes[2]);

  const valor_aaaa = (aaaa - this.ANIO_BASE) * 372;
  const valor_mm = (mm -1) * 31;
  const valor_dd = (dd - 1);

  let fechaCondensada = valor_aaaa + valor_mm + valor_dd;

  let fechaStr = fechaCondensada.toString();
  if (fechaStr.length < 4) {
    fechaStr = '0' + fechaStr; // Asegurar que tenga al menos 4 dígitos
  }

  return fechaStr;
}

public probarFechas(): void {
  console.log('🧪 === PRUEBAS DE FECHAS ===');
  
  // Prueba con la fecha del Excel: 15/05/2025
  console.log('Excel 15/05/2025:', this.procesarFecha('15/05/2025'));
  
  // Otras pruebas
  console.log('01/01/2025:', this.procesarFecha('01/01/2025'));
  console.log('31/12/2025:', this.procesarFecha('31/12/2025'));
  console.log('15/02/2026:', this.procesarFecha('15/02/2026'));
  
  console.log('✅ Pruebas de fechas completadas');
}





/***Este metodo calcula el siguiente numero, para ello toma en cuenta el importe  con sus decimales
 * Para esto se va a iterar sobre cada digito del importe y se va a multiplicar por un valor
 * dependiendo de su posicion, si es el primer digito se multiplica por 7,
 * si es el segundo por 3 y si es el tercero por 1, luego se suman todos los resultados
 * y se obtiene el residuo de la division entre 10, este es el digito verificador del importe
 * Este metodo recibe un numero con decimales y devuelve un string con el digito verificador
 * Ejemplo: 123.45 -> '5'
 * Si el importe es 0, se devuelve '0'
 * 
 * O algo así 
*/

private procesarImporte(importe: number): string {
  const parte_entera = Math.floor(importe);
  let decimales = Math.round((importe - parte_entera) * 100);


  if(decimales === 0){
    decimales = 0;
  }

  const parte_entera_str = parte_entera.toString().replace(/,/g, '');
  const decimales_str = decimales.toString().padStart(2, '0');
  const importe_completo = parte_entera_str + decimales_str;

  const arreglo_importe: number[] = [];
  for (let i = 0; i < importe_completo.length; i++) {
    arreglo_importe.push(parseInt(importe_completo[i]));
  }

  let cuenta=0;
  for(let i = arreglo_importe.length - 1; i >=0; i--){
    const valorOriginal = arreglo_importe[i];
    arreglo_importe[i] = arreglo_importe[i] * this.VALORES_IMPORTE[cuenta];

    cuenta++;
    if(cuenta === 3 ){
      cuenta = 0;
    }
  }

    const resultado_importe = arreglo_importe.reduce((sum, val) => sum + val, 0);
    const importe_condensado = resultado_importe % 10;

    return importe_condensado.toString();
}


public probarImportes(): void {
  console.log('🧪 === PRUEBAS DE IMPORTES ===');
  
  // Prueba con el importe del Excel: 2520.00
  console.log('Excel 2520.00:', this.procesarImporte(2520.00));
  
  // Otras pruebas
  console.log('100.00:', this.procesarImporte(100.00));
  console.log('500.50:', this.procesarImporte(500.50));
  console.log('1200.25:', this.procesarImporte(1200.25));
  
  console.log('✅ Pruebas de importes completadas');
}



/***Este metodo convierte las letras del periodo a caracteres para poder realizar una operación matematica
 * Para esto se va a iterar sobre cada letra del periodo y se va a convertir a un numero
 * dependiendo de su posicion, si es la primera letra se multiplica por 11, 
 * si es la segunda por 13, si es la tercera por 17, si es la cuarta por 19 y si es la quinta por 23
 * Luego se suman todos los resultados y se obtiene el residuo de la division entre 10, este es el digito verificador del periodo
 * Este metodo recibe un string con el periodo y devuelve un string con el digito verificador 
 * Ejemplo: 'FEBJUL25' -> '3'
 * Si el periodo es 'AGODIC25', se devuelve '0'
 * 
 * 
 * O algo así 
*/

private convertirCaracter(char : string):number{
  const letraUpper = char.toUpperCase();

   if (!isNaN(parseInt(letraUpper))) {
    const numero = parseInt(letraUpper);
    console.log(`  ${char} (número) → ${numero}`);
    return numero;
  }

  let valor: number;
  switch (letraUpper) {
    case 'A': valor = 1; break;
    case 'B': valor = 2; break;
    case 'C': valor = 3; break;
    case 'D': valor = 4; break;
    case 'E': valor = 5; break;
    case 'F': valor = 6; break;
    case 'G': valor = 7; break;
    case 'H': valor = 8; break;
    case 'I': valor = 9; break;
    case 'J': valor = 1; break;
    case 'K': valor = 2; break;
    case 'L': valor = 3; break;
    case 'M': valor = 4; break;
    case 'N': valor = 5; break;
    case 'O': valor = 6; break;
    case 'P': valor = 7; break;
    case 'Q': valor = 8; break;
    case 'R': valor = 9; break;
    case 'S': valor = 2; break;
    case 'T': valor = 3; break;
    case 'U': valor = 4; break;
    case 'V': valor = 5; break;
    case 'W': valor = 6; break;
    case 'X': valor = 7; break;
    case 'Y': valor = 8; break;
    case 'Z': valor = 9; break;

    default:
      console.warn('Carácter no reconocido:', char);
      valor = 0;
  }
  console.log(`${char} (letra) → ${valor}`);
  return valor; 
}


/**
 *ROBAR CONVERSIÓN DE CARACTERES
 */
public probarCaracteres(): void {
  console.log('=== PRUEBAS DE CARACTERES ===');
  
  // Pruebas con letras del período FEBJUL
  console.log('Letras de FEBJUL:');
  console.log('F →', this.convertirCaracter('F'));
  console.log('E →', this.convertirCaracter('E'));
  console.log('B →', this.convertirCaracter('B'));
  console.log('J →', this.convertirCaracter('J'));
  console.log('U →', this.convertirCaracter('U'));
  console.log('L →', this.convertirCaracter('L'));
  
  // Pruebas con números
  console.log('\nNúmeros:');
  console.log('2 →', this.convertirCaracter('2'));
  console.log('5 →', this.convertirCaracter('5'));
  
  // Pruebas con otras letras
  console.log('\nOtras letras:');
  console.log('A →', this.convertirCaracter('A'));
  console.log('Z →', this.convertirCaracter('Z'));
  
  console.log('Pruebas de caracteres completadas');
}






/***Este metodo realiza 
 * el algoritmo VBA paso a paso para generar la referencia
 * Recibe un objeto con los datos necesarios para generar la referencia 
* y devuelve un objeto con la referencia generada
* 
* o algo así
*/

/**
 * CALCULAR DÍGITO DE REFERENCIA VBA (ALGORITMO COMPLETO)
 * Este método sustituye las letras del período y aplica el algoritmo VBA final
 */
private calcularDigitoReferenciaVBA(referenciaIntermedia: string): string {
  console.log('🔐 Calculando dígito de referencia VBA para:', referenciaIntermedia);
  
  // 📋 PASO 1: Sustituir letras del período por números
  let referenciaConNumeros = '';
  
  for (let i = 0; i < referenciaIntermedia.length; i++) {
    const char = referenciaIntermedia[i];
    const valor = this.convertirCaracter(char);
    referenciaConNumeros += valor.toString();
  }
  
  console.log('🔤 Referencia con letras sustituidas:', referenciaConNumeros);
  
  // 📋 PASO 2: Convertir a array de números
  const arregloReferencia: number[] = [];
  for (let i = 0; i < referenciaConNumeros.length; i++) {
    arregloReferencia.push(parseInt(referenciaConNumeros[i]));
  }
  
  console.log('📋 Array de dígitos:', arregloReferencia);
  console.log('📏 Longitud total:', arregloReferencia.length);
  
  // 🔄 PASO 3: Multiplicar por [11,13,17,19,23] de DERECHA a IZQUIERDA
  let cuenta = 0;
  const longitudArray = arregloReferencia.length;
  
  for (let i = longitudArray - 1; i >= 0; i--) {
    const valorOriginal = arregloReferencia[i];
    const multiplicador = this.VALORES_REFERENCIA[cuenta];
    arregloReferencia[i] = valorOriginal * multiplicador;
    
    console.log(`  Posición ${i}: ${valorOriginal} × ${multiplicador} = ${arregloReferencia[i]}`);
    
    cuenta++;
    if (cuenta === 5) {  // Reset ciclo [11,13,17,19,23]
      cuenta = 0;
    }
  }
  
  // ➕ PASO 4: Sumar todos los valores
  const resultadoReferencia = arregloReferencia.reduce((sum, val) => sum + val, 0);
  console.log('➕ Suma total:', resultadoReferencia);
  
  // 🧮 PASO 5: Aplicar MOD 97 + 1
  let digitoReferencia = (resultadoReferencia % 97) + 1;
  console.log('🧮 MOD 97 + 1:', `(${resultadoReferencia} % 97) + 1 = ${digitoReferencia}`);
  
  // ✅ PASO 6: Formatear a 2 dígitos mínimo
  let digitoStr = digitoReferencia.toString();
  if (digitoStr.length === 1) {
    digitoStr = '0' + digitoStr;
  }
  
  console.log('✅ Dígito de referencia final:', digitoStr);
  return digitoStr;
}

private calcularDigitoVerificador(referencia_base: string): string {
  const arreglo_referencia: number[] = [];

  for (let i = 0; i < referencia_base.length; i++) {
    const char = referencia_base[i];
    const valor = this.convertirCaracter(char);
    arreglo_referencia.push(valor);
  }

  let cuenta = 0;
  const longitudArray = arreglo_referencia.length;
  
  for (let i = longitudArray - 1; i >= 0; i--) {
    const valorOriginal = arreglo_referencia[i];
    const multiplicador = this.VALORES_REFERENCIA[cuenta];
    arreglo_referencia[i] = valorOriginal * multiplicador;
    
    console.log(`  Posición ${i}: ${valorOriginal} × ${multiplicador} = ${arreglo_referencia[i]}`);
    
    cuenta++;
    if (cuenta === 5) {  
      cuenta = 0;
    }
  }

  const resultado_referencia = arreglo_referencia.reduce((sum, val) => sum + val, 0);
  let digito_verificador = (resultado_referencia % 97) + 1;
  console.log('🧮 MOD 97 + 1:', `(${resultado_referencia} % 97) + 1 = ${digito_verificador}`);

  let digitoStr = digito_verificador.toString();
  if (digitoStr.length === 1) {
    digitoStr = '0' + digitoStr;
  }
  return digitoStr;

}

/**
 * 🎯 MÉTODO PRINCIPAL: Generar referencia bancaria completa (ALGORITMO VBA EXACTO)
 */
generarReferencia(datos: DatosReferenciaVBA): ReferenciaGenerada {
  console.log('🚀 === GENERANDO REFERENCIA BANCARIA (ALGORITMO COMPLETO) ===');
  console.log('📊 Datos recibidos:', datos);
  
  try {
    // ✅ VERIFICAR SI ES CONCEPTO DE ASESORÍAS
    const codigoConcepto = parseInt(datos.concepto);
    const esAsesoria = (codigoConcepto === 4 || codigoConcepto === 5);
    
    console.log('🎯 ¿Es concepto de asesoría?', esAsesoria, 'Código:', codigoConcepto);
    
    // 🏗️ CONSTRUIR REFERENCIA BASE SEGÚN TIPO
    const año = datos.año || new Date().getFullYear();
    const codigoPlantel = this.CODIGO_PLANTEL; // 2716
    const concepto = datos.concepto.padStart(2, '0');
    const matricula = datos.matricula;
    
    let referenciaBase: string;
    
    if (esAsesoria && datos.siglas_materia) {
      // ✅ PARA ASESORÍAS: usar siglas de materia
      referenciaBase = `${año}${codigoPlantel}${concepto}${matricula}${datos.siglas_materia}`;
      console.log('📚 Referencia con siglas de materia:', datos.siglas_materia);
    } else {
      // ✅ PARA CONCEPTOS NORMALES: usar período
      const periodo = datos.periodo || this.calcularPeriodo(datos.fecha);
      referenciaBase = `${año}${codigoPlantel}${concepto}${matricula}${periodo}`;
      console.log('📅 Referencia con período:', periodo);
    }
    
    console.log('🏗️ Referencia base:', referenciaBase);
    
    // 📅 PASO 3: Calcular fecha condensada (algoritmo VBA)
    const fechaCondensada = this.procesarFecha(datos.fecha);
    
    // 💰 PASO 4: Calcular importe condensado (algoritmo VBA)
    const importeCondensado = this.procesarImporte(datos.importe);
    
    // 🔢 PASO 5: Agregar variable (siempre "0")
    const variable = "0";
    
    // 🎯 PASO 6: Construir referencia intermedia
    const referenciaIntermedia = `${referenciaBase}${fechaCondensada}${importeCondensado}${variable}`;
    
    console.log('🎯 Referencia intermedia:', referenciaIntermedia);
    
    // 🔐 PASO 7: Calcular dígito de referencia VBA
    const digitoReferencia = this.calcularDigitoReferenciaVBA(referenciaIntermedia);
    
    // ✅ PASO 8: Referencia final
    const referenciaCompleta = referenciaIntermedia + digitoReferencia;
    
    console.log('✅ === RESULTADO FINAL ===');
    console.log(`📋 Referencia base: ${referenciaBase}`);
    console.log(`📅 Fecha condensada: ${fechaCondensada}`);
    console.log(`💰 Importe condensado: ${importeCondensado}`);
    console.log(`🔢 Variable: ${variable}`);
    console.log(`🔐 Dígito referencia: ${digitoReferencia}`);
    console.log(`🎯 Referencia completa: ${referenciaCompleta}`);
    console.log(`📚 Tipo: ${esAsesoria ? 'ASESORÍA' : 'CONCEPTO NORMAL'}`);
    
    return {
      referenciaCompleta,
      referenciaBase: referenciaIntermedia,
      digitoVerificador: digitoReferencia,
      fechaCondensada,
      importeCondensado
    };
    
  } catch (error) {
    console.error('❌ Error al generar referencia:', error);
    throw new Error(`Error en generación de referencia: ${error}`);
  }
}

/**
 * 🧪 PROBAR CÁLCULO DE DÍGITO VERIFICADOR
 */
public probarDigitoVerificador(): void {
  console.log('🧪 === PRUEBAS DE DÍGITO VERIFICADOR ===');
  
  // Prueba con ejemplo del Excel
  const referenciaEjemplo = '20252716011222100452FEBJUL25';
  console.log('Referencia ejemplo:', referenciaEjemplo);
  console.log('Dígito calculado:', this.calcularDigitoVerificador(referenciaEjemplo));
  
  // Otras pruebas
  console.log('\nOtras pruebas:');
  console.log('Test 1:', this.calcularDigitoVerificador('202527160112345FEBJUL25'));
  console.log('Test 2:', this.calcularDigitoVerificador('202527160267890AGODIC25'));
  
  console.log('✅ Pruebas de dígito verificador completadas');
}














/**
 * 🧪 PRUEBA COMPLETA DEL ALGORITMO
 */
public pruebaCompleta(): ReferenciaGenerada {
  console.log('🧪 === PRUEBA COMPLETA DEL ALGORITMO VBA EXACTO ===');
  
  // Datos exactos del Excel
  const datosEjemplo: DatosReferenciaVBA = {
    concepto: '06',
    fecha: '06/09/2024',  // ✅ Para que dé FEBJUL25
    importe: 2520.00,
    variable: '0',
    matricula: '2430302527'
  };
  
  console.log('📊 Datos de prueba:', datosEjemplo);
  
  const resultado = this.generarReferencia(datosEjemplo);
  
  console.log('🎯 === COMPARACIÓN FINAL CON EXCEL ===');
  console.log('Excel esperado: 20252716062430302527AGODIC2443451082');
  console.log('Generado:      ', resultado.referenciaCompleta);
  console.log('¿Coincide?     ', resultado.referenciaCompleta === '20252716062430302527AGODIC2443451082' ? '✅ ¡PERFECTO!' : '❌ Revisar');
  
  return resultado;
}
public probarFechaEspecifica(): void {
  console.log('🧪 === PRUEBA DE FECHA ESPECÍFICA ===');
  const resultado = this.calcularPeriodo('15/05/2025');
  console.log('Para 15/05/2025 debería ser FEBJUL25:', resultado);
}




















guardarReferencia(referencia: ReferenciaCompleta, alumnoId: number): Observable<any> {
  console.log('💾 Guardando referencia en BD...');
  console.log('📊 Datos a enviar:', referencia);
  console.log('👤 Alumno ID:', alumnoId);

  const payload = {
    // Datos principales de la referencia
    referencia_completa: referencia.referenciaCompleta,
    referencia_base: referencia.referenciaBase,
    digito_verificador: referencia.digitoVerificador,
    
    // Datos del alumno y concepto
    alumno_id: alumnoId,
    concepto_id: referencia.concepto_id,
    codigo_pago: referencia.codigo_pago,
    
    // Datos financieros
    importe: referencia.importe,
    fecha_vencimiento: referencia.fechaVencimiento,
    fecha_generada: referencia.fechaGeneracion || new Date().toISOString().split('T')[0],
    dias_vigentes: referencia.diasVigentes,
    estado: referencia.estado || 'Vigente',
    
    // Datos académicos
    carrera_id: referencia.carrera_id,
    periodo_id: referencia.periodo_id,
    semestre_id: referencia.semestre_id,
    materia_id: referencia.materia_id,
    
    // Información adicional
    descripcion: referencia.descripcion,
    observaciones: referencia.observaciones,
    
    // Metadatos
    fecha_creacion: new Date().toISOString(),
    usuario_creador: 'sistema'
  };

  console.log('📤 Payload final para BD:', payload);

  return this.http.post(`${this.BASE_URL}/referencias`, payload);
}

obtenerReferenciasAlumno(alumnoId: number): Observable<any> {
  console.log('📋 Obteniendo referencias del alumno:', alumnoId);
  return this.http.get(`${this.BASE_URL}/referencias/alumno/${alumnoId}`);
}

marcarComoPagada(referenciaId: number, datos: any): Observable<any> {
  return this.http.put(`${this.BASE_URL}/referencias/${referenciaId}/pagar`, datos);
}

validarReferencia(referencia: string): Observable<any> {
  console.log('🔍 Validando referencia:', referencia);
  return this.http.get(`${this.BASE_URL}/referencias/validar/${referencia}`);
}

}
