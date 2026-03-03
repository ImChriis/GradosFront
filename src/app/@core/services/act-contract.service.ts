import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ActContractService {
  private api: string = environment.api;
  private http = inject(HttpClient);

  getActs(){
    return this.http.get<any>(`${this.api}/actContracts`);
  }

  getActUsersByCodigoActo(codigoActo: number){
    return this.http.get<any>(`${this.api}/actContracts/${codigoActo}/users`);
  }

  getActTotal(CodigoActo: number){
    return this.http.get<any>(`${this.api}/actContracts/${CodigoActo}/total`);
  }

  recalculateTotal(CodigoActo: number){
    return this.http.post<any>(`${this.api}/actContracts/${CodigoActo}/recalculate`, {});
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
}
