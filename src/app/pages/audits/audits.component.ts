import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import {
  catchError,
  debounceTime,
  delay,
  map,
  Observable,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import {
  AuditQuery,
  AuditRow,
  AuditsService,
} from '../../@core/services/audits.service';
import { UsersService } from '../../@core/services/users.service';
import { LoaderComponent } from '../../@core/components/loader/loader.component';

@Component({
  selector: 'app-audits',
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
    ReactiveFormsModule,
    LoaderComponent,
  ],
  templateUrl: './audits.component.html',
  styleUrl: './audits.component.scss',
})
export class AuditsComponent implements OnInit {
  private auditsService = inject(AuditsService);
  private usersService = inject(UsersService);
  private fb = inject(FormBuilder);

  isLoading = signal(true);

  /** Búsqueda (`q`) + filtros, todo se manda al backend */
  filtersForm = this.fb.group({
    q: [''],
    tabla: [''],
    CodUser: [''],
    accion: [''],
    desde: [''],
    hasta: [''],
  });

  /** Opciones del select TABLA, armadas desde /audit/tables */
  tablas$: Observable<{ label: string; value: string }[]> = this.auditsService
    .getAuditTables()
    .pipe(
      map((res) =>
        (res.data ?? []).map((t) => ({
          label: `${t.tabla_afectada} (${t.total})`,
          value: t.tabla_afectada,
        }))
      ),
      startWith<{ label: string; value: string }[]>([]),
      catchError(() => of<{ label: string; value: string }[]>([]))
    );

  /** El input de búsqueda vive dentro de un ng-template de PrimeNG, por eso
   *  se enlaza por referencia directa ([formControl]) y no por formControlName. */
  qControl = this.filtersForm.controls.q;

  /** Opciones del select USUARIO, armadas desde /users (Nombre + Apellido) */
  usuarios$: Observable<{ label: string; value: number }[]> = this.usersService
    .getUsers()
    .pipe(
      map((users) =>
        (users ?? []).map((u) => ({
          label:
            `${u.Nombre ?? ''} ${u.Apellido ?? ''}`.trim() ||
            u.Usuario ||
            `#${u.CodUsuario}`,
          value: u.CodUsuario,
        }))
      ),
      startWith<{ label: string; value: number }[]>([]),
      catchError(() => of<{ label: string; value: number }[]>([]))
    );

  audits$!: Observable<AuditRow[]>;

  ngOnInit(): void {
    // startWith(null) dispara la primera carga; valueChanges vuelve a disparar en cada cambio
    this.audits$ = this.filtersForm.valueChanges.pipe(
      startWith(null),
      debounceTime(300),
      tap(() => this.isLoading.set(true)),
      switchMap(() =>
        this.auditsService.getAudits(this.buildQuery()).pipe(
          map((res) => res.data ?? []),
          delay(300),
          tap(() => this.isLoading.set(false)),
          catchError(() => {
            this.isLoading.set(false);
            return of<AuditRow[]>([]);
          })
        )
      )
    );
  }

  private buildQuery(): AuditQuery {
    const f = this.filtersForm.getRawValue();

    return {
      page: 1,
      limit: 200,
      q: f.q?.trim() || undefined,
      tabla: f.tabla || undefined,
      CodUser: f.CodUser ? Number(f.CodUser) : undefined,
      accion: f.accion || undefined,
      desde: f.desde || undefined,
      hasta: f.hasta || undefined,
    };
  }

  clearFilters(): void {
    this.filtersForm.reset({
      q: '',
      tabla: '',
      CodUser: '',
      accion: '',
      desde: '',
      hasta: '',
    });
  }
}
