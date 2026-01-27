import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Specility } from '../models/speciality.model';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpecialitiesService {
  private http = inject(HttpClient);
  api: string = environment.api;

  getAllSpecialities(){
    return this.http.get<Specility[]>(`${this.api}/specialities`).pipe(
      map((res: Specility[] = []) => {
        console.log('Raw response:', res);
        const items = res ?? [];
        const sorted = items.slice().sort((a: any, b: any) => (b.id ?? 0) - (a.id ?? 0));
        return sorted.map((specility: any) => ({ ...specility }));
      })
    );
  }
}
