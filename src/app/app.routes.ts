import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  {
    path: '', loadComponent: () => import('./components/dashboard/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'billing', loadComponent: () => import('./components/billing/billing.component').then(m => m.BillingComponent) },
      { path: 'stock', loadComponent: () => import('./components/stock/stock.component').then(m => m.StockComponent) },
      { path: 'medicine-search', loadComponent: () => import('./components/medicine-search/medicine-search.component').then(m => m.MedicineSearchComponent) },
      { path: 'reports', loadComponent: () => import('./components/reports/reports.component').then(m => m.ReportsComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
