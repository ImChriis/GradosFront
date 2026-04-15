import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private api: string = environment.api;
  private http = inject(HttpClient);

  getSpecialitiesPdf(usuarioReporte: string){
    return this.http.get(`${this.api}/reports/specialitiesPdf/${usuarioReporte}`, {responseType: 'blob'});
  }

  getSpecialitiesExcel(usuarioReporte: string){
    return this.http.get(`${this.api}/reports/specialitiesExcel/${usuarioReporte}`, {responseType: 'blob'});
  }
  
  getInstitutionsPdf(usuarioReporte: string){
    return this.http.get(`${this.api}/reports/institutionsPdf/${usuarioReporte}`, {responseType: 'blob'});
  }

  getInstitutionsExcel(usuarioReporte: string){
    return this.http.get(`${this.api}/reports/institutionsExcel/${usuarioReporte}`, {responseType: 'blob'});
  }

  getActPlacesPdf(usuarioReporte: string){
    return this.http.get(`${this.api}/reports/actPlacesPdf/${usuarioReporte}`, {responseType: 'blob'});
  }

  getActPlacesExcel(usuarioReporte: string){
    return this.http.get(`${this.api}/reports/actPlacesExcel/${usuarioReporte}`, {responseType: 'blob'});
  }

  getClientsPdf(body: any){
    return this.http.post(`${this.api}/reports/clientsPdf`, body, {responseType: 'blob'});
  }

  getClientsExcel(body: any){
    return this.http.post(`${this.api}/reports/clientsExcel`, body, {responseType: 'blob'});
  }
  
  getActListPdf(body: any){
    return this.http.post(`${this.api}/reports/actListPdf`, body, {responseType: 'blob'});
  }

  getActListExcel(body: any){
    return this.http.post(`${this.api}/reports/actListExcel`, body, {responseType: 'blob'});
  }

  getActListTxt(body: any){
    return this.http.post(`${this.api}/reports/actListTxt`, body, {responseType: 'blob'});
  }
}
