import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  users: { email: string; password: string }[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    this.users = [
      { email: 'bella@gmail.com', password: '123' },
      { email: 'alex@gmail.com', password: '123' },
      { email: 'malees@gmail.com', password: '123' },
    ];
  }

  login() {
    let Userfound = false;

    for (let u of this.users) {
      if (u.email === this.email && u.password === this.password) {
        Userfound = true;
        break;
      }
    }

    if (Userfound) {
      this.router.navigate(['/profile']);
    } else {
      this.errorMessage = 'Invalid email or password';
    }
  }
}
