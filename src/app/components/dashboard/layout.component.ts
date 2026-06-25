// layout.component.ts
import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  collapsed = signal(false);

  constructor(
    private auth: AuthService,
    private data: DataService,
    private router: Router
  ) {}

  user() { return this.auth.getUser()(); }
  userInitials() { return this.user()?.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'; }
  lowStockCount() { return this.data.getLowStockMedicines().length; }
  today() { return new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
  logout() { this.auth.logout(); this.router.navigate(['/login']); }
}
