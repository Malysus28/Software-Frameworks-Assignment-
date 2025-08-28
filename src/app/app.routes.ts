import { Routes } from '@angular/router';
import { Home } from '../home/home';
import { Profile } from '../profile/profile';
import { Login } from '../login/login';
import { Chats } from '../chats/chats';
import { Channels } from '../channels/channels';
import { authGuard } from './services/auth/auth-guard';

// defining the routes for website
export const routes: Routes = [
  // home
  { path: '', component: Home, title: 'Home' },
  // profile
  {
    path: 'profile',
    component: Profile,
    title: 'Profile',
    canActivate: [authGuard],
  },
  // login
  { path: 'login', component: Login, title: 'Login' },
  // chat
  { path: 'chat', component: Chats, title: 'Chat' },
  // channels
  {
    path: 'channels',
    component: Channels,
    title: 'Channels',
  },
  { path: 'groups/:groupId/channels/:channelId', component: Chats },
];
