import { Component, inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoginForm } from '../../models/forms/login-form';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { DOCUMENT, UpperCasePipe } from '@angular/common';
import { UppercaseDirective } from "../../directives/uppercase.directive";
import { User } from '../../models/user.mode';

@Component({
  selector: 'app-login',
  imports: [
    InputTextModule,
    ButtonModule,
    ReactiveFormsModule,
    UppercaseDirective
],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy{
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);

  LoginForm: FormGroup<LoginForm> = this.fb.group({
    usuario: new FormControl<string>('', { nonNullable: true }),
    clave: new FormControl<string>('', { nonNullable: true })
  })

   ngOnInit(): void {
    this.renderer.addClass(this.document.body, 'login-bg');
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(this.document.body, 'login-bg');
  }

  showPassword(){
    const passwordField = document.querySelector('#password') as HTMLInputElement;
    const eyeIcon = document.querySelector('.btn-Pass i') as HTMLElement;
    if (passwordField) {
      if (passwordField.type === 'password') {
        passwordField.type = 'text';
        eyeIcon.classList.remove('pi-eye-slash');
        eyeIcon.classList.add('pi-eye');
      } else {
        passwordField.type = 'password';
        eyeIcon.classList.remove('pi-eye');
        eyeIcon.classList.add('pi-eye-slash');
      }
    }
  }

  onSubmit(){
    if(this.LoginForm.valid){
      this.authService.login(this.LoginForm.value as User).subscribe({
        next: (res) => {
          this.messageService.add({severity:'success', summary: 'Éxito', detail: 'Inicio de sesión exitoso'});
          // console.log(res);
          this.router.navigateByUrl('/home');
        },
        error: (err) => {
          this.messageService.add({severity:'error', summary: 'Error', detail: 'Error al iniciar sesión | ' + err.error.message});
        }
      }
      )
    }
  }
}
