import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

type SafeUser = {
  id: string;
  username: string;
  email: string;
  roles: string[];
  groups: string[];
  birthdate?: string;
  age?: number | null;
  valid?: boolean;
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class Profile implements OnInit {
  user: SafeUser | null = null;
  formUser: SafeUser & { password?: string } = {
    id: '',
    username: '',
    birthdate: '',
    age: null,
    email: '',
    valid: false,
    roles: [],
    groups: [],
    password: '',
  };
  savedMsg = '';
  showForm = false;

  allUsers: SafeUser[] = [];
  loadingUsers = false;
  errMsg = '';

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    // pull current user from localStorage
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      this.router.navigate(['/']);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      // Phase 1 sometimes stores { user, token }, sometimes just user
      const current: SafeUser = parsed?.user ?? parsed;
      if (!current?.id) throw new Error('no user');

      this.user = current;
      this.formUser = { ...current };

      // If super admin, load all users table
      this.user = current;
      this.formUser = { ...current };
    } catch {
      this.router.navigate(['/']);
    }
  }
  toggleEdit() {
    this.showForm = !this.showForm;
  }

  save(): void {
    const raw = localStorage.getItem('currentUser');
    const parsed = raw ? JSON.parse(raw) : {};
    const token = parsed?.token;

    // keep token shape if it existed
    const next = token
      ? { token, user: { ...this.formUser } }
      : { ...this.formUser };

    localStorage.setItem('currentUser', JSON.stringify(next));
    this.user = { ...this.formUser };
    this.savedMsg = 'Saved!';
    setTimeout(() => (this.savedMsg = ''), 1500);
  }

  reset(): void {
    if (this.user) {
      this.formUser = { ...this.user };
    } else {
      this.formUser = {
        id: '',
        username: '',
        birthdate: '',
        age: null,
        email: '',
        valid: false,
        roles: [],
        groups: [],
        password: '',
      };
    }
  }
}
