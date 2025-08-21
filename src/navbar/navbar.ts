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
  constructor(private auth: Auth, private router: Router) {}

  // for the logout button
  logout() {
    // clearing the local storage and remove token??
    this.auth.logout();
    // navigate to login page
    this.router.navigate(['/login']);
  }
  get loggedIn() {
    return this.auth.isLoggedIn();
  }
}
