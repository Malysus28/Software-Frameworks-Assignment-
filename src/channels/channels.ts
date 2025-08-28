import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-channels',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './channels.html',
  styleUrls: ['./channels.css'],
})
export class Channels {
  constructor(private router: Router) {}

  goTo(groupId: string, channelId: string) {
    this.router.navigate(['/groups', groupId, 'channels', channelId]);
  }
}
