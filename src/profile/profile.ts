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
  // ── your existing fields ───────────────────────────────────────────────────
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

  // ── NEW: super admin panel state ───────────────────────────────────────────
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
      if (this.isSuperAdmin()) {
        this.fetchAllUsers();
      }
    } catch {
      this.router.navigate(['/']);
    }
  }

  // ── your existing actions ──────────────────────────────────────────────────
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

  toggleEdit() {
    this.showForm = !this.showForm;
  }

  // ── NEW: helpers & API calls for super admin ───────────────────────────────
  isSuperAdmin(): boolean {
    return !!this.user?.roles?.includes('super-admin');
  }

  private actorId(): string | null {
    return this.user?.id ?? null;
  }

  fetchAllUsers(): void {
    const actor = this.actorId();
    if (!actor) return;

    this.loadingUsers = true;
    this.errMsg = '';
    this.http
      .get<SafeUser[]>('http://localhost:3000/api/users', {
        params: { actorId: actor },
      })
      .subscribe({
        next: (list) => {
          this.allUsers = list;
          this.loadingUsers = false;
        },
        error: (e) => {
          this.errMsg = e?.error?.error || 'Failed to load users';
          this.loadingUsers = false;
        },
      });
  }

  promoteToGroupAdmin(target: SafeUser): void {
    const actor = this.actorId();
    if (!actor) return;

    this.http
      .post<{ ok: boolean; user: SafeUser }>(
        `http://localhost:3000/api/users/${target.id}/promote`,
        { role: 'group-admin' },
        { params: { actorId: actor } }
      )
      .subscribe({
        next: (res) => {
          const i = this.allUsers.findIndex((u) => u.id === target.id);
          if (i > -1) this.allUsers[i] = res.user;
        },
        error: (e) => alert(e?.error?.error || 'Promote failed'),
      });
  }

  promoteToSuperAdmin(target: SafeUser): void {
    const actor = this.actorId();
    if (!actor) return;

    this.http
      .post<{ ok: boolean; user: SafeUser }>(
        `http://localhost:3000/api/users/${target.id}/promote`,
        { role: 'super-admin' },
        { params: { actorId: actor } }
      )
      .subscribe({
        next: (res) => {
          const i = this.allUsers.findIndex((u) => u.id === target.id);
          if (i > -1) this.allUsers[i] = res.user;
        },
        error: (e) => alert(e?.error?.error || 'Promote failed'),
      });
  }

  removeUser(target: SafeUser): void {
    const actor = this.actorId();
    if (!actor) return;
    if (!confirm(`Remove user "${target.username}"?`)) return;

    this.http
      .delete<{ ok: boolean; removed: SafeUser }>(
        `http://localhost:3000/api/users/${target.id}`,
        { params: { actorId: actor } }
      )
      .subscribe({
        next: () => {
          this.allUsers = this.allUsers.filter((u) => u.id !== target.id);
        },
        error: (e) => alert(e?.error?.error || 'Remove failed'),
      });
  }
}
