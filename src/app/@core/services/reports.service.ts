import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private api: string = environment.api;
  private http = inject(HttpClient);

  getActPlacesPdf(){
    return this.http.get(`${this.api}/reports/actPlacesPdf`, {responseType: 'blob'});
  }

  getActPlacesExcel(){
    return this.http.get(`${this.api}/reports/actPlacesExcel`, {responseType: 'blob'});
  }
}
