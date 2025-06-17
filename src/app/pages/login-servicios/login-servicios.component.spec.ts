import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginServiciosComponent } from './login-servicios.component';

describe('LoginServiciosComponent', () => {
  let component: LoginServiciosComponent;
  let fixture: ComponentFixture<LoginServiciosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginServiciosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginServiciosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
