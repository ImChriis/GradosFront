import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { map, Subject, tap } from 'rxjs';
import { Institution } from '../models/institution.model';

@Injectable({
  providedIn: 'root'
})
export class InstitutionsService {
  private api: string = environment.api;
  private http = inject(HttpClient);
  private refresh$ = new Subject<void>();
  public refresObservable$ = this.refresh$.asObservable();
  
  getAllInstitutions(){
    return this.http.get<Institution[]>(`${this.api}/institutions`).pipe(
      map((res: Institution[] = []) => {
        console.log("Raw Response: ", res);
        const items = res ?? [];
        const sorted = items.slice().sort((a: Institution, b: Institution) => (b.CodigoInst ?? 0) - (a.CodigoInst ?? 0));
        return sorted.map((institution: Institution) => ({ ...institution }));
      })
    )
  }

  addInstitution(body: Partial<Institution>){
    return this.http.post<Institution>(`${this.api}/institutions/add`, body).pipe(
      tap(() => this.refresh$.next())
    )
  }

  updateInstitution(CoodigoInst: number, body: Partial<Institution>){
    return this.http.put<Institution>(`${this.api}/institutions/update/${CoodigoInst}`, body).pipe(
      tap(() => this.refresh$.next())
    )
  }
}
