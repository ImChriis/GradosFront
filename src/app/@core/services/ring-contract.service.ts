import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RingContractService {
  private http = inject(HttpClient);
  private api: string = environment.api;

  getRingContract() {
  return this.http.get(`${this.api}/ringContracts`).pipe(
    tap((data) => {
      console.log(data);
    })
  )
  }
}
