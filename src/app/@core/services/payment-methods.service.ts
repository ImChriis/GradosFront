import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Subject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodsService {
  private api: string = environment.api;
  private http = inject(HttpClient);
  private refresh$ = new Subject<void>();
  public refreshObservable$ = this.refresh$.asObservable();

  getPaymentMethods() {
    return this.http.get<any>(`${this.api}/metodoPago`).pipe(
      tap((res: any) => {
        console.log('Raw response:', res);
      })
    )
  }

  addPaymentMethod(body: any){
    return this.http.post(`${this.api}/metodoPago/add`, body).pipe(
      tap(() => this.refresh$.next())
    )
  }

  updatePaymentMethod(idMetodoPago: number, body: any){
    return this.http.put(`${this.api}/metodoPago/update/${idMetodoPago}`, body).pipe(
      tap(() => this.refresh$.next())
    )
  }
}
