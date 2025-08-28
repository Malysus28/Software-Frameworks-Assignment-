import { Component, OnInit } from '@angular/core';
import { ChatService } from '../app/services/chat.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chats',
  templateUrl: './chats.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./chats.css'],
})
export class Chats implements OnInit {
  messages: string[] = [];
  newMessage = '';

  // Hard-coded Phase 1 users (from server seed)
  currentUserId = 'u-100'; // bella
  currentGroupId = 'g1'; // Design Team
  currentChannelId = 'c1'; // general

  constructor(private chat: ChatService) {}

  ngOnInit(): void {
    // grab the user saved by /api/auth, get the user in the local storage
    const raw = localStorage.getItem('currentUser');
    const u = raw ? JSON.parse(raw) : null;
    this.currentUserId = u?.user?.id ?? u?.id ?? 'u-100';

    this.chat.connect();
    this.chat.join(
      this.currentUserId,
      this.currentGroupId,
      this.currentChannelId
    );

    this.chat.onSystem((msg: any) =>
      this.messages.push(`[system] ${msg.text}`)
    );
    this.chat.onMessage((msg: any) =>
      this.messages.push(`${msg.user.username}: ${msg.text}`)
    );
  }

  sendMessage() {
    const t = this.newMessage.trim();
    if (!t) return;
    this.chat.send(t);
    this.newMessage = '';
  }
}
