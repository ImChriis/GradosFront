import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Settings } from '../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private api: string = environment.api;
  private http = inject(HttpClient);

  getSettings(){
    return this.http.get(`${this.api}/settings`);
  }

  updateSettings(id: string, body: Settings){
    return this.http.put(`${this.api}/settings/update/${id}`, body);
  }
}
