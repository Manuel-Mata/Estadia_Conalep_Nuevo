import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginAlumnoComponent } from './login-alumno.component';

describe('LoginAlumnoComponent', () => {
  let component: LoginAlumnoComponent;
  let fixture: ComponentFixture<LoginAlumnoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginAlumnoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginAlumnoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
