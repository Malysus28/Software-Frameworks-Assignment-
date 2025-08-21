import { Routes } from '@angular/router';
// importing the components that i created
import { Home } from '../home/home';
import { Profile } from '../profile/profile';
import { Login } from '../login/login';
import { authGuard } from './services/auth/auth-guard';

// defining the routes for website
export const routes: Routes = [
  { path: '', component: Home, title: 'Home' },
  {
    path: 'profile',
    component: Profile,
    title: 'Profile',
    canActivate: [authGuard],
  },
  { path: 'login', component: Login, title: 'Login' },
];
