import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { User } from '../models/user.mode';
import { map } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private api: string = environment.api;
  private router = inject(Router);

  private codUserSignal = signal<string | null>(this.getStoredCodUser());
  public CodUser = computed(() => this.codUserSignal())

 private getStoredCodUser(): string | null {
    const storedUser = localStorage.getItem('User');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        return parsed?.user?.id ?? null;
      } catch {
        return null;
      }
    }
    return null;
  }

  login(body: Partial<User>){
    const headers = { 'Content-Type': 'application/json' };
    return this.http.post(`${this.api}/auth/login`,body, { headers }).pipe(
      map((res: any) => {
        // console.log('Login response:', res);
        this.codUserSignal.set(res.user.id);
        localStorage.setItem('User', JSON.stringify(res));
        return res;
      })
    )
  }

  logout() {
    localStorage.removeItem('User');
    this.codUserSignal.set(null);
    this.router.navigate(['/']);
  }
}
