import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Settings } from '../models/settings.model';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private api: string = environment.api;
  private http = inject(HttpClient);
  private CodSucursalSignal = signal<string | null>(null);
  public CodSucursal = computed(() => this.CodSucursalSignal())


  getSettings(){
    return this.http.get(`${this.api}/settings`).pipe(
      tap((res: any) => {
        if(res?.CodSucursal){
          this.CodSucursalSignal.set(res.CodSucursal);
        }
      })
    )
  }

  updateSettings(id: string, body: Settings){
    return this.http.put(`${this.api}/settings/update/${id}`, body).pipe(
      tap(() => {
        if(body?.CodSucursal){
          this.CodSucursalSignal.set(body.CodSucursal);
        }
        
      })
    )
  }
}
