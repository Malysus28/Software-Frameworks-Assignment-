import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private socket!: Socket;

  connect() {
    if (!this.socket) {
      // hardcoded to backend because this keeps failing and i dont know why
      this.socket = io('http://localhost:3000', {
        transports: ['websocket', 'polling'],
      });
      this.socket.on('connect', () =>
        console.log('socket connected', this.socket.id)
      );
      this.socket.on('connect_error', (err) =>
        console.error('connect_error', err)
      );
    }
  }

  onConnect(cb: () => void) {
    this.socket.on('connect', cb);
  }

  join(userId: string, groupId: string, channelId: string) {
    this.socket.emit('join', { userId, groupId, channelId });
  }

  onMessage(cb: (msg: any) => void) {
    this.socket.on('message', cb);
  }

  onSystem(cb: (msg: any) => void) {
    this.socket.on('system', cb);
  }

  send(text: string) {
    this.socket.emit('message', { text });
  }

  ngOnDestroy(): void {
    try {
      this.socket?.disconnect();
    } catch {}
  }
  leave() {
    if (this.socket) {
      this.socket.emit('leave');
    }
  }
}
