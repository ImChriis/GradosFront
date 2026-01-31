import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Act } from '../models/act.model';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActsService {
  private api: string = environment.api;
  private http = inject(HttpClient);

  getAllActs(){{
    return this.http.get<Act[]>(`${this.api}/acts`).pipe(
      map((res: Act[] = []) => {
       console.log("Raw response: ", res);
       const items = res ?? [];
       const sorted = res.slice().sort((a: any, b: any) => (b.id ?? 0) - (a.id ?? 0)) ;
       return sorted.map((act: any) => ({ ...act }));
      })
    )
  }}
}
