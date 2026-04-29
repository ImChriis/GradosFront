import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user.mode';
import { map, Subject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private api: string = environment.api;
  private http = inject(HttpClient);
  private refresh$ = new Subject<void>();
  public refreshObservavble$ = this.refresh$.asObservable();

  getUsers(){
    return this.http.get<User[]>(`${this.api}/users`).pipe(
      map((res: User[] = []) => {
        // console.log('Raw response:', res);
        const items = res ?? [];
        const sorted = items.slice().sort((a: User, b: User) => (b.CodUsuario ?? 0) - (a.CodUsuario ?? 0));
        return sorted.map((user: User) => ({ ...user }));
      })
    )
  }

  addUser(body: User){
    return this.http.post(`${this.api}/users/add`, body).pipe(
      tap(() => this.refresh$.next())
    )
  }

  updateUser(CodUsuario: number, body: User){
    return this.http.put(`${this.api}/users/update/${CodUsuario}`, body).pipe(
      tap(() => this.refresh$.next())
    );
  }
}
