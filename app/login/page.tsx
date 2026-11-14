import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="auth-wrap">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
