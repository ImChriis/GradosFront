import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private api: string = environment.api;
  private http = inject(HttpClient);

  downloadBackup(){
    return this.http.get(`${this.api}/backup/download`, {responseType: 'blob'});
  }
}
