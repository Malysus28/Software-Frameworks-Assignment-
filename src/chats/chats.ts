import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chats',
  imports: [FormsModule],
  templateUrl: './chats.html',
  styleUrls: ['./chats.css'],
})
export class Chats {
  messages: string[] = []; // all messages will be stored here
  newMessage: string = ''; // what you type in the input box

  sendMessage() {
    if (this.newMessage.trim() !== '') {
      this.messages.push(this.newMessage); // add to messages list
      this.newMessage = ''; // clear the input
    }
  }
}
