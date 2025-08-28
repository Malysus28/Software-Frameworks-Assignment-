import { Component, OnInit } from '@angular/core';
import { ChatService } from '../app/services/chat.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-chats',
  templateUrl: './chats.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./chats.css'],
})
export class Chats implements OnInit {
  messages: string[] = [];
  newMessage = '';
  currentChannelName = '';
  currentGroupId = '';
  currentChannelId = '';
  currentUserId = 'u-100';

  // Hard-coded Phase 1 users
  // currentUserId = 'u-100';
  // currentGroupId = 'g1';
  // currentChannelId = 'c1';

  constructor(
    private chat: ChatService,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // load currentUser as you already do
    const raw = localStorage.getItem('currentUser');
    const u = raw ? JSON.parse(raw) : null;
    this.currentUserId = u?.user?.id ?? u?.id ?? 'u-100';

    this.chat.connect();

    // read from the URL
    this.route.paramMap.subscribe((p: ParamMap) => {
      this.currentGroupId = p.get('groupId') ?? 'g1';
      this.currentChannelId = p.get('channelId') ?? 'c1';

      // leave old room before joining new one
      this.chat.leave();
      this.chat.join(
        this.currentUserId,
        this.currentGroupId,
        this.currentChannelId
      );

      // fetch channel name
      this.http
        .get<any[]>(
          `http://localhost:3000/api/groups/${this.currentGroupId}/channels`,
          { params: { userId: this.currentUserId } }
        )
        .subscribe((list) => {
          const ch = list.find((c) => c.id === this.currentChannelId);
          this.currentChannelName = ch?.name ?? this.currentChannelId;
        });
    });

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
