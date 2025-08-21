import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  // if user is logged in look for the stored token convert the result to a boolean
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // when user is successfully logged in store values of currentuser and token
  setSession(token: string, user: any) {
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
  // clear storage
  logout() {
    localStorage.clear();
  }
  // get logged in user from storage as string and change it to JS object
  getUser() {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  }
}
