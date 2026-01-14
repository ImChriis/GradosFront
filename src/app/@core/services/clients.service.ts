import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { map } from 'rxjs';
import { Client } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  private http = inject(HttpClient);
  private api: string = environment.api;

  findAllClients(){
    return this.http.get<Client[]>(`${this.api}/clients`).pipe(
      map((res: Client[] = []) => {
        console.log('Raw response:', res);
        const items = res ?? [];
        const sorted = items.slice().sort((a: any, b: any) => (b.id ?? 0) - (a.id ?? 0));
        return sorted.map((client: any) => ({ ...client }));
      })
    );
  }

  //   findAllClients(){
  //   return this.http.get<Client[]>(`${this.api}/clients`).pipe(
  //     map((res: Client[] = []) => {
  //       const items = res ?? [];
  //       const sorted = items.slice().sort((a: any, b: any) => (b.id ?? 0) - (a.id ?? 0));
  //       return sorted.map((client: any) => ({ ...client }));
  //     })
  //   );
  // }
}
