import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { Institution } from '../models/institution.model';

@Injectable({
  providedIn: 'root'
})
export class InstitutionsService {
  private api: string = environment.api;
  private http = inject(HttpClient);

  getAllInstitutions(){
    return this.http.get<Institution[]>(`${this.api}/institutions`).pipe(
      map((res: Institution[] = []) => {
        console.log("Raw Response: ", res);
        const items = res ?? [];
        const sorted = items.slice().sort((a: any, b: any) => (b.id ?? 0) - (a.id ?? 0));
        return sorted.map((institution: any) => ({ ...institution }));
      })
    )
  }
}
