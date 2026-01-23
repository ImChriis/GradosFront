import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { User } from '../models/user.mode';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private api: string = environment.api;

  login(body: Partial<User>){
    const headers = { 'Content-Type': 'application/json' };
    return this.http.post(`${this.api}/auth/login`,body, { headers }).pipe(
      map((res: any) => {
        console.log('Login response:', res);
        localStorage.setItem('User', JSON.stringify(res));
        return res;
      })
    )
  }
}
