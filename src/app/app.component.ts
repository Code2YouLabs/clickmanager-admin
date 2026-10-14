import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'ClickManager Admin';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.carregarUsuarioCompleto().subscribe();
  }
}
