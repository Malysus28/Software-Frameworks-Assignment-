import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

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
  selector: 'app-usersettings',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './usersettings.html',
})
export class UserSettings implements OnInit {
  user: SafeUser | null = null;

  // super-admin panel state
  allUsers: SafeUser[] = [];
  loadingUsers = false;
  errMsg = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      this.router.navigate(['/login']);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      this.user = (parsed?.user ?? parsed) as SafeUser;
    } catch {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.isSuperAdmin()) {
      this.router.navigate(['/profile']);
      return;
    }

    this.fetchAllUsers();
  }

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
