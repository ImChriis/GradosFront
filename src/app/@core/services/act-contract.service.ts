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
}
