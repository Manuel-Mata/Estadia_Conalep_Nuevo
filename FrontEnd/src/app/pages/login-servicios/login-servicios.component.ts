import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login-servicios',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './login-servicios.component.html',
  styleUrl: './login-servicios.component.css'
})
export class LoginServiciosComponent {

}
