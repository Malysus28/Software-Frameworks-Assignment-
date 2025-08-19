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

  ngOnInit() {}

  login() {
    console.log('test');
    // fetch is communicating with the back end, using the post method

    fetch('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: this.email,
        password: this.password,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.status);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Success:', data);
        if (data.ok) {
          this.router.navigate(['/profile']);
        } else {
          this.errorMessage = data.message;
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }
}
