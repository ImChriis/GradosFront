import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Subject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActContractService {
  private api: string = environment.api;
  private http = inject(HttpClient);
  private refresh$ = new Subject<void>();
  public refreshObservable$ = this.refresh$.asObservable();
 
  getActs(){
    return this.http.get<any>(`${this.api}/actContracts`).pipe(
      tap((res) => {
        // console.log(res)
      })
    )
  }

  getActUsersByCodigoActo(codigoActo: number){
    return this.http.get<any>(`${this.api}/actContracts/${codigoActo}/users`).pipe(
      tap((res) => {
        // console.log(res)
      }
    ));
  }

  createAct(body: any){
    return this.http.post<any>(`${this.api}/actContracts/createAct`, body).pipe(
      tap(() => this.refresh$.next())
    )
  }

  updateAct(codigoActo: number, body: any){
    return this.http.put<any>(`${this.api}/actContracts/updateAct/${codigoActo}`, body).pipe(
      tap(() => this.refresh$.next())
    )
  }

  getActTotal(CodigoActo: number){
    return this.http.get<any>(`${this.api}/actContracts/${CodigoActo}/total`);
  }

  recalculateTotal(CodigoActo: number){
    return this.http.post<any>(`${this.api}/actContracts/recalculateTotal`, { CodigoActo });
  }

  getTotalPaid(CodigoActo: number){
    return this.http.get<any>(`${this.api}/actContracts/${CodigoActo}/totalPaid`);
  }

  getSaldo(CodigoActo: number){
    return this.http.get<any>(`${this.api}/actContracts/${CodigoActo}/saldo`);
  }

  getActUsersAmount(CodigoActo: number){
    return this.http.get<any>(`${this.api}/actContracts/${CodigoActo}/usersAmount`);
  }

  addUserToAct(body: any){
    return this.http.post<any>(`${this.api}/actContracts/addUser`, body).pipe(
      tap(() => this.refresh$.next())
     );
  }

  getPaymentDataByUser(CodigoActo: number, NoContrato: string, NuCedula: string){
    return this.http.get<any>(`${this.api}/actContracts/${CodigoActo}/${NuCedula}/${NoContrato}`);
  }
  
  getRecibosByUserContract(NoContrato: number){
    return this.http.get<any>(`${this.api}/actContracts/${NoContrato}`);
  }

  getAbonosByUserContract(NoContrato: string, NuCedula: string, NoRecibo: number){
    return this.http.get<any>(`${this.api}/actContracts/abonos/${NoContrato}/${NuCedula}/${NoRecibo}`);
  }

  addARecibo(body: any){  // recibo y abono es lo mismo
    return this.http.post<any>(`${this.api}/actContracts/createRecibo`, body).pipe(
      tap(() =>  this.refresh$.next())
    )
  }
}
