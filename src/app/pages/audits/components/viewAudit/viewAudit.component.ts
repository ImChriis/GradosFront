import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AuditRow } from '../../../../@core/services/audits.service';

/** Una fila de la tabla de detalles del modal. */
export interface DetalleCampo {
  campo: string;
  /** `null` cuando el registro no tiene valor anterior (INSERT/DELETE) */
  anterior: string | null;
  nuevo: string;
}

/**
 * Modal de solo lectura que se abre al clickear una fila de la tabla de
 * auditoría y muestra la información completa del movimiento en un formato
 * legible (en lugar del JSON / texto cortado con "..." de la tabla).
 */
@Component({
  selector: 'app-view-audit',
  imports: [CommonModule],
  templateUrl: './viewAudit.component.html',
  styleUrl: './viewAudit.component.scss',
})
export class ViewAuditComponent implements OnInit {
  private ref = inject(DynamicDialogRef, { optional: true });
  private config = inject(DynamicDialogConfig);

  /** La fila completa seleccionada en la tabla */
  audit = signal<AuditRow | null>(null);

  /** `detalles` desarmado en filas legibles */
  campos = signal<DetalleCampo[]>([]);

  /** true -> las columnas son CAMPO / ANTERIOR / NUEVO (UPDATE) */
  esDiff = signal(false);

  /** Texto libre cuando `detalles` no es una lista de campos */
  mensaje = signal('');

  /** false -> el registro no trae `detalles` */
  hayDetalles = signal(false);

  ngOnInit(): void {
    const row: AuditRow | null = this.config?.data?.audit ?? null;
    this.audit.set(row);
    if (row) this.parsearDetalles(row);
  }

  close(): void {
    this.ref?.close(null);
  }

  /**
   * `detalles` tiene tres formas según `auditService.js`:
   *  - INSERT / DELETE -> JSON del snapshot            -> tabla CAMPO / VALOR
   *  - UPDATE           -> "campo: viejo -> nuevo; "    -> tabla CAMPO / ANTERIOR / NUEVO
   *    (el backend siempre cierra cada cambio con ';')
   *  - movimiento masivo -> texto libre ("Correlativo ... NoRecibo -> 534723 ...")
   *    -> se muestra tal cual
   */
  private parsearDetalles(row: AuditRow): void {
    const crudo = (row.detalles ?? '').trim();

    if (!crudo) {
      this.hayDetalles.set(false);
      return;
    }
    this.hayDetalles.set(true);

    // 1. Snapshot JSON (INSERT/DELETE). El backend ya lo deja parseado.
    const obj = row.detalles_obj ?? this.tryParseJson(crudo);
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      this.campos.set(
        Object.entries(obj).map(([campo, valor]) => ({
          campo,
          anterior: null,
          nuevo: this.valorLegible(valor),
        }))
      );
      this.esDiff.set(false);
      return;
    }

    // 2. Cambios de un UPDATE: el backend los cierra siempre con ';'
    if (crudo.endsWith(';')) {
      const filas = this.parsearDiff(crudo);
      if (filas.length > 0) {
        this.campos.set(filas);
        this.esDiff.set(true);
        return;
      }
    }

    // 3. Texto libre
    this.mensaje.set(row.detalles ?? crudo);
  }

  /** "campo: viejo -> nuevo; campo2: viejo -> nuevo; " -> filas */
  private parsearDiff(raw: string): DetalleCampo[] {
    const filas: DetalleCampo[] = [];

    for (const parte of raw.split(';')) {
      const p = parte.trim();
      if (!p) continue;

      const i = p.indexOf(':');
      const j = p.indexOf('->');
      if (i === -1 || j === -1 || j < i) continue;

      filas.push({
        campo: p.slice(0, i).trim(),
        anterior: p.slice(i + 1, j).trim(),
        nuevo: p.slice(j + 2).trim(),
      });
    }

    return filas;
  }

  private tryParseJson(txt: string): Record<string, any> | null {
    if (!txt.startsWith('{')) return null;
    try {
      const v = JSON.parse(txt);
      return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
    } catch {
      return null;
    }
  }

  private valorLegible(valor: any): string {
    if (valor === null || valor === undefined) return 'NULL';
    if (typeof valor === 'object') return JSON.stringify(valor);
    if (valor === '') return '(vacío)';
    return String(valor);
  }
}
