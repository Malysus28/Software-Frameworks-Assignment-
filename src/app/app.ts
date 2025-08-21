import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // ngOnInit() {
  //   console.log('test if DOM is ready');
  //   if (typeof Storage !== 'undefined') {
  //     console.log('storage is ready');
  //     localStorage.setItem('lastname', 'Smith');
  //     console.log('lastname is set to ' + localStorage.getItem('lastname'));
  //   } else {
  //     console.log('storage is not available');
  //   }
  // }
}
