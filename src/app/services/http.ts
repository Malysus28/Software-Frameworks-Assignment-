import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Http {
  private httpService = inject(HttpClient);
  private server = 'http://localhost:4200';

  // call the component and get the user, send the HTTP GET request to the local host
  getUsers() {
    return this.httpService.get(`${this.server}/users`);
  }
}
