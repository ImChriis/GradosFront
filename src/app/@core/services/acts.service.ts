import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';

import { map, Subject, tap } from 'rxjs';
import { ActPlace } from '../models/act.model';

@Injectable({
  providedIn: 'root'
})
export class ActsService {
  private api: string = environment.api;
  private http = inject(HttpClient);
  private refresh$ = new Subject<void>();
  public refreshObservable$ = this.refresh$.asObservable();

  getAllActsPlaces(){{
    return this.http.get<ActPlace[]>(`${this.api}/actPlaces`).pipe(
      map((res: ActPlace[] = []) => {
       console.log("Raw response: ", res);
       const items = res ?? [];
       const sorted = res.slice().sort((a: any, b: any) => (b.id ?? 0) - (a.id ?? 0)) ;
       return sorted.map((act: any) => ({ ...act }));
      })
    )
  }}

  addActPlace(body: Partial<ActPlace>){
    return this.http.post<ActPlace>(`${this.api}/actPlaces/add`, body).pipe(
      tap(() => this.refresh$.next())
    )
  }

  updateActPlace(CoLugar: number, body: Partial<ActPlace>){
    return this.http.put<ActPlace>(`${this.api}/actPlaces/update/${CoLugar}`, body).pipe(
      tap(() => this.refresh$.next())
    )
  }


}
