import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Speciality } from '../models/speciality.model';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpecialitiesService {
  private http = inject(HttpClient);
  api: string = environment.api;

  getAllSpecialities(){
    return this.http.get<Speciality[]>(`${this.api}/specialities`).pipe(
      map((res: Speciality[] = []) => {
        console.log('Raw response:', res);
        const items = res ?? [];
        const sorted = items.slice().sort((a: any, b: any) => (b.CodigoEsp ?? 0) - (a.CodigoEsp ?? 0));
        return sorted.map((specility: any) => ({ ...specility }));
      })
    );
  }

  addSpeciality(body: Partial<Speciality>){
  return this.http.post<Speciality>(`${this.api}/specialities/add`, body); 
  }

  updateSpeciality(CodigoEsp: number, body: Partial<Speciality>){
    return this.http.put<Speciality>(`${this.api}/specialities/update/${CodigoEsp}`, body);
  }
}
