import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { map, Subject, tap } from 'rxjs';
import { Bank } from '../models/bank.model';

@Injectable({
  providedIn: 'root'
})
export class BanksService {
  private api: string = environment.api;
  private http = inject(HttpClient);
  private refresh$ = new Subject<void>();
  public refreshObservable$ = this.refresh$.asObservable();

  getAllBanks(){
    return this.http.get<Bank[]>(`${this.api}/banks`).pipe(
      map((res: Bank[] = []) => {
        console.log("Raw response: ", res);
        const items = res ?? [];
        const sorted = items.slice().sort((a: Bank, b: Bank) => (b.id ?? 0) - (a.id ?? 0));
        return sorted.map((bank: Bank) => ({ ...bank }));
      })
    )
  }

  addBank(body: Partial<Bank>){
    return this.http.post<Bank>(`${this.api}/banks/add`, body).pipe(
      tap(() => this.refresh$.next())
    )
  }

  updateBank(id: number, body: Partial<Bank>){
    return this.http.put<Bank>(`${this.api}/banks/update/${id}`,body).pipe(
      tap(() => this.refresh$.next())
    )
  }
 }
