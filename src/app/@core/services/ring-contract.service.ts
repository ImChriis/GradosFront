import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';

export interface RingContractQuery {
  q?: string;
  /** estado 1..9 */
  estado?: string | number;
  /** 1 = incluir los dados de baja (InActivo = 1) */
  todos?: 0 | 1;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RingContractService {
  private api: string = environment.api;
  private http = inject(HttpClient);

  /** Cualquier escritura dispara esto, para recargar la tabla principal */
  private refresh$ = new Subject<void>();
  public refreshObservable$ = this.refresh$.asObservable();

  // ----------------------------------------------------------------
  //  LECTURA
  // ----------------------------------------------------------------

  /**
   * GET /ringContracts?q=&estado=&todos=1&page=&limit=
   * Sin page/limit devuelve el array plano (compatibilidad con el front actual).
   */
  getContracts(query: RingContractQuery = {}): Observable<any> {
    let params = new HttpParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get(`${this.api}/ringContracts`, { params });
  }

  /** GET /ringContracts/:id -> contrato completo + datos del cliente */
  getContractById(id: number | string) {
    return this.http.get<any>(`${this.api}/ringContracts/${id}`);
  }

  /** GET /ringContracts/cliente/:nucedula */
  getContractsByClient(nucedula: string | number) {
    return this.http.get<any>(`${this.api}/ringContracts/cliente/${nucedula}`);
  }

  /** GET /ringContracts/:id/saldo -> total / pagado / saldo ya calculados */
  getSaldo(id: number | string) {
    return this.http.get<any>(`${this.api}/ringContracts/${id}/saldo`);
  }

  /** GET /ringContracts/:id/recibos */
  getRecibos(id: number | string) {
    return this.http.get<any>(`${this.api}/ringContracts/${id}/recibos`);
  }

  /** GET /ringContracts/:id/abonos/:noRecibo */
  getAbonos(id: number | string, noRecibo: number | string) {
    return this.http.get<any>(`${this.api}/ringContracts/${id}/abonos/${noRecibo}`);
  }

  // ----------------------------------------------------------------
  //  ESCRITURA
  // ----------------------------------------------------------------

  /** POST /ringContracts/create -> requiere NoContrato y nucedula */
  createContract(body: any) {
    return this.http.post<any>(`${this.api}/ringContracts/create`, body).pipe(
      tap(() => this.refresh$.next())
    );
  }

  /** PUT /ringContracts/update/:id -> pestañas Detalles y Regalías */
  updateContract(id: number | string, body: any) {
    return this.http.put<any>(`${this.api}/ringContracts/update/${id}`, body).pipe(
      tap(() => this.refresh$.next())
    );
  }

  /** PUT /ringContracts/updateEstado/:id -> pestaña Estado */
  updateEstado(id: number | string, body: any) {
    return this.http.put<any>(`${this.api}/ringContracts/updateEstado/${id}`, body).pipe(
      tap(() => this.refresh$.next())
    );
  }

  /** PUT /ringContracts/updateTotals/:id -> pestaña Saldo, recalcula mnsaldo */
  updateTotals(id: number | string, body: any) {
    return this.http.put<any>(`${this.api}/ringContracts/updateTotals/${id}`, body).pipe(
      tap(() => this.refresh$.next())
    );
  }

  /** POST /ringContracts/pay/:id -> botón "Efectuar Pago" */
  payContract(id: number | string, body: any) {
    return this.http.post<any>(`${this.api}/ringContracts/pay/${id}`, body).pipe(
      tap(() => this.refresh$.next())
    );
  }

  /** POST /ringContracts/createRecibo -> modal de pagos, recibo en memoria de facturación */
  createRecibo(body: any) {
    return this.http.post<any>(`${this.api}/ringContracts/createRecibo`, body);
  }

  /** POST /ringContracts/createDeposito -> modal de pagos, abono de un recibo */
  createDeposito(body: any) {
    return this.http.post<any>(`${this.api}/ringContracts/createDeposito`, body);
  }
}
