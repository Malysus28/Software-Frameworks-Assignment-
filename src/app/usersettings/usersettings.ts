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

  // group admin state
  newGroupName = '';
  myGroups: Array<{ id: string; name: string; createdBy: string }> = [];
  groupsLoading = false;

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
    // if user is neither super-admin nor group-admin send them away
    if (!this.isSuperAdmin() && !this.isGroupAdmin()) {
      this.router.navigate(['/profile']);
      return;
    }
    // Only super-admins and group admins should load the users table:
    if (this.isSuperAdmin() || this.isGroupAdmin()) {
      this.fetchAllUsers();
    }
    // Group admins can manage groups:
    if (this.isGroupAdmin()) {
      this.loadMyGroups();
    }
  }
  isGroupAdmin(): boolean {
    return !!this.user?.roles?.includes('group-admin');
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
  // to promote group admin function situation
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
  // group admin stuff
  loadMyGroups(): void {
    const actor = this.actorId();
    if (!actor) return;

    this.groupsLoading = true;
    this.http
      .get<any[]>('http://localhost:3000/api/groups', {
        params: { userId: actor },
      })
      .subscribe({
        next: (list) => {
          // this.myGroups = list.map((g) => ({ id: g.id, name: g.name }));
          this.myGroups = list.map((g) => ({
            id: g.id,
            name: g.name,
            createdBy: g.createdBy,
          }));
          this.groupsLoading = false;
        },
        error: () => (this.groupsLoading = false),
      });
  }

  createGroup(): void {
    const actor = this.actorId();
    if (!actor) return;

    const name = this.newGroupName.trim();
    if (!name) return;

    this.http
      .post<{ ok: boolean; group: any }>(
        'http://localhost:3000/api/groups',
        { name },
        { params: { actorId: actor } }
      )
      .subscribe({
        next: (res) => {
          this.newGroupName = '';
          this.myGroups.push({
            id: res.group.id,
            name: res.group.name,
            createdBy: res.group.createdBy ?? (this.user?.id || ''),
          });
        },
        error: (e) => alert(e?.error?.error || 'Create group failed'),
      });
  }

  // delete group for group admin
  deleteGroup(g: { id: string; name: string; createdBy: string }): void {
    const actor = this.user?.id;
    if (!actor) return;

    // ✅ only allow creator to proceed
    if (!this.canDeleteGroup(g)) {
      alert('You can only delete groups you created.');
      return;
    }

    if (!confirm(`Delete group "${g.name}"?`)) return;

    this.http
      .delete<{ ok: boolean }>(`http://localhost:3000/api/groups/${g.id}`, {
        params: { actorId: actor },
      })
      .subscribe({
        next: () => {
          this.myGroups = this.myGroups.filter((x) => x.id !== g.id);
        },
        error: (e) => alert(e?.error?.error || 'Delete group failed'),
      });
  }

  // only creator can delete group
  canDeleteGroup(g: { createdBy: string }): boolean {
    return this.user?.id === g.createdBy; // only the creator can delete
  }
}
