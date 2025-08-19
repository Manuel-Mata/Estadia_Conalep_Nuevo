 // src/app/pages/login-alumno/login-alumno.component.ts
  import { Component, OnInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
  import { CommonModule, isPlatformBrowser } from '@angular/common';
  import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
  import { Router, RouterModule } from '@angular/router';
  import { trigger, transition, style, animate } from '@angular/animations';
  import { Subject, takeUntil } from 'rxjs';

  // Importar servicio
  import { AuthService, LoginAlumnoRequest } from '../../services/auth.service';

  @Component({
    selector: 'app-login-alumno',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './login-alumno.component.html',
    styleUrls: ['./login-alumno.component.css'],
    animations: [
      trigger('fadeIn', [
        transition(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
        ])
      ])
    ]
  })
  export class LoginAlumnoComponent implements OnInit, OnDestroy {
    // Propiedades del componente
    loginForm: FormGroup;
    isLoading = false;
    showPassword = false;
    errorMessage = '';
    successMessage = '';
    private destroy$ = new Subject<void>();
    private platformId = inject(PLATFORM_ID);

    constructor(
      private fb: FormBuilder,
      private authService: AuthService,
      private router: Router
    ) {
      // Inicializar el formulario con validaciones
      this.loginForm = this.fb.group({
        matricula: ['', [
          Validators.required,
          Validators.minLength(6),
          Validators.pattern(/^[A-Z0-9]+$/)
        ]],
        email: ['', [
          Validators.required,
          Validators.email,
          Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
        ]],
        password: ['', [
          Validators.required,
          Validators.minLength(6)
        ]],
        remember: [false]
      });
    }

    ngOnInit(): void {
      // Verificar si ya está autenticado (solo en browser)
      if (isPlatformBrowser(this.platformId) && this.authService.isAuthenticated()) {
        this.redirectBasedOnUserType();
      }

      // Limpiar mensajes cuando el usuario empiece a escribir
      this.loginForm.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.clearMessages();
        });
    }

    ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
    }

    // Getters para fácil acceso a los controles del formulario
    get matricula() { return this.loginForm.get('matricula'); }
    get email() { return this.loginForm.get('email'); }
    get password() { return this.loginForm.get('password'); }
    get remember() { return this.loginForm.get('remember'); }

    // Método principal para enviar el formulario
    onSubmit(): void {
      if (this.loginForm.invalid) {
        this.markFormGroupTouched();
        this.showError('Por favor, completa todos los campos correctamente.');
        return;
      }

      const loginData: LoginAlumnoRequest = {
        matricula: this.matricula?.value.toUpperCase(),
        email: this.email?.value.toLowerCase(),
        password: this.password?.value,
        remember: this.remember?.value
      };

      this.performLogin(loginData);
    }

    // Realizar el login
    private performLogin(loginData: LoginAlumnoRequest): void {
      this.isLoading = true;
      this.clearMessages();

      this.authService.loginAlumno(loginData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            
            if (response.success) {
              this.showSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
              
              // Guardar datos solo en browser
              if (isPlatformBrowser(this.platformId) && response.token) {
                localStorage.setItem('auth_token', response.token);
                localStorage.setItem('current_user', JSON.stringify(response.usuario));
              }
              
              setTimeout(() => {
                this.router.navigate(['/portalAlumno']);
              }, 1500);
            } else {
              this.showError(response.message || 'Error al iniciar sesión');
            }
          },
          error: (error) => {
            this.isLoading = false;
            this.handleLoginError(error);
          }
        });
    }

    // Manejar errores de login
    private handleLoginError(error: any): void {
      let errorMessage = 'Error de conexión. Intenta nuevamente.';

      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 401) {
        errorMessage = 'Credenciales incorrectas. Verifica tu matrícula y contraseña.';
      } else if (error.status === 0) {
        errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
      }

      this.showError(errorMessage);
    }

    // Redirigir según tipo de usuario
    private redirectBasedOnUserType(): void {
      const user = this.authService.getCurrentUser();
      
      if (user?.tipo_usuario === 'alumno') {
        this.router.navigate(['/portalAlumno']);
      } else {
        this.router.navigate(['/portalAlumno']); // Por defecto a portal alumno
      }
    }

    // Toggle para mostrar/ocultar contraseña
    togglePasswordVisibility(): void {
      this.showPassword = !this.showPassword;
    }

    // Marcar todos los campos como touched para mostrar errores
    private markFormGroupTouched(): void {
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
      });
    }

    // Mostrar mensaje de error
    private showError(message: string): void {
      this.errorMessage = message;
      this.successMessage = '';
      
      setTimeout(() => {
        this.errorMessage = '';
      }, 5000);
    }

    // Mostrar mensaje de éxito
    private showSuccess(message: string): void {
      this.successMessage = message;
      this.errorMessage = '';
    }

    // Limpiar mensajes
    private clearMessages(): void {
      this.errorMessage = '';
      this.successMessage = '';
    }

    // Métodos adicionales
    onForgotPassword(): void {  
      this.router.navigate(['/recuperar-password']);
    }

    onActivateAccount(): void {
      this.router.navigate(['/activar-cuenta']);
    }

    onContactSupport(): void {
      if (isPlatformBrowser(this.platformId)) {
        window.open('mailto:soporte@universidad.edu.mx?subject=Ayuda con Portal Estudiantil');
      }
    }

    goBack(): void {
      this.router.navigate(['/']);
    }

    getFieldError(fieldName: string): string {
      const field = this.loginForm.get(fieldName);
      
      if (field?.errors && field.touched) {
        if (field.errors['required']) {
          return `${this.getFieldLabel(fieldName)} es requerido`;
        }
        if (field.errors['email']) {
          return 'Ingresa un correo electrónico válido';
        }
        if (field.errors['minlength']) {
          return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
        }
        if (field.errors['pattern']) {
          return `${this.getFieldLabel(fieldName)} tiene un formato inválido`;
        }
      }
      
      return '';
    }

    private getFieldLabel(fieldName: string): string {
      const labels: { [key: string]: string } = {
        'matricula': 'La matrícula',
        'email': 'El correo',
        'password': 'La contraseña'
      };
      return labels[fieldName] || 'El campo';
    }

    hasFormErrors(): boolean {
      return this.loginForm.invalid && this.loginForm.touched;
    }

    getFieldClass(fieldName: string): string {
      const field = this.loginForm.get(fieldName);
      
      if (field?.touched) {
        return field.valid ? 'success' : 'error';
      }
      
      return '';
    }
  }
