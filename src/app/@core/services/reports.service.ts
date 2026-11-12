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

  /** Cierre Z */
  generateClosingPdf(body: any){
    return this.http.post(`${this.api}/reports/generateClosingPdf`, body, {responseType: 'blob'});
  }

  /** Fecha que le toca al próximo Cierre Z (día pendiente o hoy) */
  getClosingZFecha(){
    return this.http.get<{ fecha: string }>(`${this.api}/reports/closingZFecha`);
  }

  generateClosingXPdf(body: any){
    return this.http.post(`${this.api}/reports/generateClosingXPdf`, body, {responseType: 'blob'});
  }

  /** Contratos de anillo en un estado (1..7) */
  getContractsByStatusPdf(body: any){
    return this.http.post(`${this.api}/reports/contractsByStatusPdf`, body, {responseType: 'blob'});
  }

  getContractsByStatusExcel(body: any){
    return this.http.post(`${this.api}/reports/contractsByStatusExcel`, body, {responseType: 'blob'});
  }

  /** Contratos cuyo "Requerido el" vence en los próximos 30 días */
  getRingExpiringPdf(body: any){
    return this.http.post(`${this.api}/reports/ringExpiringPdf`, body, {responseType: 'blob'});
  }

  getRingExpiringExcel(body: any){
    return this.http.post(`${this.api}/reports/ringExpiringExcel`, body, {responseType: 'blob'});
  }

  /** Recibos entre dos fechas (YYYY-MM-DD) */
  getRecibosPorRango(desde: string, hasta: string){
    return this.http.get<any[]>(`${this.api}/reports/recibos`, { params: { desde, hasta } });
  }

  /** Un recibo por su número (404 si no existe) */
  getReciboPorNumero(NoRecibo: number){
    return this.http.get<any>(`${this.api}/reports/recibos/${NoRecibo}`);
  }

  getGraduatesByActPdf(usuarioReporte: string){
    return this.http.get(`${this.api}/reports/graduatesByActPdf/${usuarioReporte}`, {responseType: 'blob'});
  }

  getGraduatesByActExcel(usuarioReporte: string){
    return this.http.get(`${this.api}/reports/graduatesByActExcel/${usuarioReporte}`, {responseType: 'blob'});
  }

  /** Datos completos de un contrato (acto o anillo) con recibos y depósitos */
  getContractData(body: any){
    return this.http.post(`${this.api}/reports/contractData`, body, {responseType: 'blob'});
  }
}
