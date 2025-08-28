import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Auth } from '../app/services/auth/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  user: any = null;
  constructor(private auth: Auth, private router: Router) {
    const raw = localStorage.getItem('currentUser');
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      this.user = parsed?.user ?? parsed ?? null;
    } catch {
      this.user = null;
    }
  }
  isSuperAdmin(): boolean {
    return (
      Array.isArray(this.user?.roles) && this.user.roles.includes('super-admin')
    );
  }
  isGroupAdmin(): boolean {
    return (
      Array.isArray(this.user?.roles) && this.user.roles.includes('group-admin')
    );
  }
  // for the logout button
  logout() {
    // clearing the local storage and remove token
    this.auth.logout();
    // navigate to login page
    this.router.navigate(['/login']);
  }
  get loggedIn() {
    return this.auth.isLoggedIn();
  }
}
