import { Routes } from '@angular/router';
import { LoginForm } from '../lib/pages/login/login-form';
import { SignupForm } from '../lib/pages/signup/signup-form';
import { AuthContainer } from '../lib/auth-container';

export const authLayoutRoutes: Routes = [
  {
    path: '',
    component: AuthContainer,
    children: [
      {
        path: 'login',
        component: LoginForm,
      },
      {
        path: 'signup',
        component: SignupForm,
      },
    ],
  },
];
