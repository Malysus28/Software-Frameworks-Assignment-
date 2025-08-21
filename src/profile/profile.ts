import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  user: any = null; // what's shown in the card
  formUser: any = {
    // editable variables for the form
    username: '',
    birthdate: '',
    age: 0,
    email: '',
    password: '',
    valid: false,
  };
  savedMsg = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // pull current user from localStorage
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      // not logged in so back to login
      this.router.navigate(['/']);
      return;
    }
    try {
      // JSON string change to object
      this.user = JSON.parse(raw);
      // duplicate the current user data into the form
      this.formUser = { ...this.user };
    } catch {
      // if that fails then navigate to not logged in state
      this.router.navigate(['/']);
    }
  }

  save(): void {
    // write edited form data back to localStorage
    localStorage.setItem('currentUser', JSON.stringify(this.formUser));
    // update the card with the edited stuff
    this.user = { ...this.formUser };
  }

  // reset form
  reset(): void {
    //to clear when reset is clicked
    this.formUser = {
      username: '',
      birthdate: '',
      age: null,
      email: '',
      valid: false,
    };
  }
}
