import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';

/**
 * Tipos del módulo de auditoría.
 * Espejo exacto de `auditoria_general` y de las respuestas de
 * `GradosBack/src/modules/audit/auditController.js`
 */
export type AuditAccion = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditRow {
  id_auditoria: number;
  tabla_afectada: string;
  accion: AuditAccion;
  id_registro: number | null;
  /** usuario que provocó el movimiento (FK -> usuarios.CodUsuario) */
  CodUser: number | null;
  /** `CONCAT(usuarios.Nombre, ' ', usuarios.Apellido)` ya resuelto por el backend con LEFT JOIN */
  usuario_nombre: string | null;
  /** INSERT/DELETE => JSON.stringify de la fila. UPDATE => texto "campo: viejo -> nuevo; " */
  detalles: string | null;
  /** `detalles` ya parseado a objeto cuando venía como JSON, si no `null` */
  detalles_obj: Record<string, any> | null;
  /** usuario del servidor de BD (USER()). El backend aún lo devuelve, pero ya no se muestra */
  usuario_bd: string | null;
  fecha_hora: string;
}

export interface AuditQuery {
  page?: number;
  limit?: number;
  tabla?: string;
  /** filtra por el usuario que realizó la operación (FK -> usuarios.CodUsuario) */
  CodUser?: number;
  accion?: AuditAccion | string;
  /** YYYY-MM-DD */
  desde?: string;
  /** YYYY-MM-DD */
  hasta?: string;
  q?: string;
}

export interface AuditPage {
  status: string;
  data: AuditRow[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface AuditTableRow {
  tabla_afectada: string;
  total: number;
  ultima_actividad: string | null;
}

export interface AuditTablesResponse {
  status: string;
  data: AuditTableRow[];
}

export interface AuditStats {
  status: string;
  total: number;
  porAccion: { accion: string; total: number }[];
  porTabla: (AuditTableRow & {
    inserts: number;
    updates: number;
    deletes: number;
  })[];
  recientes: AuditRow[];
}

export interface AuditRecordHistory {
  status: string;
  data: AuditRow[];
  total: number;
}

export interface AuditByIdResponse {
  status: string;
  data: AuditRow;
}

@Injectable({
  providedIn: 'root'
})
export class AuditsService {
  private http = inject(HttpClient);
  private api: string = environment.api;

  /**
   * GET /audit?page=&limit=&tabla=&CodUser=&accion=&desde=&hasta=&q=
   * Los parámetros vacíos/undefined no se envían.
   */
  getAudits(query: AuditQuery = {}) {
    let params = new HttpParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<AuditPage>(`${this.api}/audit`, { params });
  }

  /** GET /audit/tables -> tablas monitoreadas con su cantidad de movimientos */
  getAuditTables() {
    return this.http.get<AuditTablesResponse>(`${this.api}/audit/tables`);
  }

  /** GET /audit/stats -> total, desglose por acción, por tabla y los 10 más recientes */
  getAuditStats() {
    return this.http.get<AuditStats>(`${this.api}/audit/stats`);
  }

  /** GET /audit/record/:tabla/:idRegistro -> historial completo de un registro */
  getRecordHistory(tabla: string, idRegistro: number) {
    return this.http.get<AuditRecordHistory>(
      `${this.api}/audit/record/${encodeURIComponent(tabla)}/${idRegistro}`
    );
  }

  /** GET /audit/:id -> detalle de una auditoría */
  getAuditById(id: number) {
    return this.http.get<AuditByIdResponse>(`${this.api}/audit/${id}`);
  }
}
