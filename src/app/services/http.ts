import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Http {
  private httpService = inject(HttpClient);
  private server = 'http://localhost:4200';

  getUsers() {
    return this.httpService.get(`${this.server}/users`);
  }
}
