import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { UsersService } from '../../@core/services/users.service';
import { MessageService } from 'primeng/api';
import { delay, Observable, startWith, switchMap, tap } from 'rxjs';
import { User } from '../../@core/models/user.mode';
import { UserForm } from '../../@core/models/forms/users-form';
import { InputTextModule } from 'primeng/inputtext';
import { OnlyNumbersDirective } from '../../@core/directives/only-numbers.directive';
import { UppercaseDirective } from '../../@core/directives/uppercase.directive';
import { LoaderComponent } from '../../@core/components/loader/loader.component';

@Component({
  selector: 'app-users',
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
    ReactiveFormsModule,
    OnlyNumbersDirective,
    UppercaseDirective,
    LoaderComponent
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit{
  private usersService = inject(UsersService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  users$!: Observable<User[]>;
  selectedUser!: User | null;
  isEnabled: boolean = false;
  isAdding: boolean = false;
  CodUser!: number;
  isLoading = signal(true);

  private passwordsMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const clave = group.get('Clave')?.value;
    const clave2 = group.get('Clave2')?.value; // Cambiado para coincidir con tu Form
    return clave === clave2 ? null : { passwordsMismatch: true };
  };

  userForm: FormGroup<UserForm> = this.fb.group({
      CodUsuario: new FormControl<number | null>(null),
      Cedula: new FormControl<string | null>(null),
      Nombre: new FormControl<string | null>(null),
      Apellido: new FormControl<string | null>(null),
      Usuario: new FormControl<string | null>(null),
      Clave: new FormControl<string | null>(null),
      Clave2: new FormControl<string | null>(null),
      MaTipoUsr: new FormControl<string | null>(null),
      FechaReg: new FormControl<Date | string | null>(new Date())
  },
  { validators: [this.passwordsMatchValidator] });

  ngOnInit(): void {
    this.users$ = this.usersService.refreshObservavble$.pipe(
      startWith(null),
      tap(() => this.isLoading.set(true)),
      switchMap(() => {
        return this.usersService.getUsers();
      }),
      delay(500),
      tap(() => this.isLoading.set(false))
    )

    this.userForm.disable();
    this.selectedUser = null;
  }

  selectUser(user: User){
    this.isAdding = true;
    this.isEnabled = true;
    this.selectedUser = user;
    this.userForm.enable();
    this.userForm.patchValue({
      CodUsuario: user.CodUsuario,
      Cedula: user.Cedula,
      Nombre: user.Nombre,
      Apellido: user.Apellido,
      Usuario: user.Usuario,
      Clave: user.Clave,
      MaTipoUsr: user.MaTipoUsr,
      FechaReg: user.FechaReg
    });

    this.CodUser = user.CodUsuario;
    console.log(this.CodUser);
  }

  add(){
    this.isEnabled = true;
    this.isAdding = true;
    this.userForm.enable();

    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(
        'input[formcontrolname="Cedula"]'
      );
      el?.focus();
    }, 0);
  }

  save(){
    if(this.userForm.hasError('passwordsMismatch')){
      this.messageService.add({ severity: 'error', summary: 'Error de validación', detail: 'Las contraseñas no coinciden.' });
      return;
    }

    if(this.selectedUser){
      console.log('Updating user with CodUsuario:', this.CodUser);
      this.usersService.updateUser(this.CodUser, this.userForm.value as User).subscribe({
        next: (res) => {
          this.messageService.add({ severity: 'success', summary: 'Usuario actualizado', detail: `Usuario actualizado exitosamente.` });
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al actualizar el usuario.' });

          console.error('Error updating user:', err);
        }
      })
    }else{
      this.usersService.addUser(this.userForm.value as User).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Usuario agregado', detail: `Usuario agregado exitosamente.` });
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al agregar el usuario.' });

          console.error('Error adding user:', err);
        }
      })
    }
  }

  cancel(){
    this.isAdding = false;
    this.isEnabled = false
    this.selectedUser = null;
    this.userForm.reset();
    this.userForm.disable();
  }


  delete(){

  }
}
