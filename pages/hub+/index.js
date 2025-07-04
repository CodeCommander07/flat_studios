import AuthWrapper from '@/components/AuthWrapper';

export default function Dashboard() {
  return (
    <AuthWrapper requiredRole="hubPlus">
      <h1>Welcome to the Dashboard</h1>
    </AuthWrapper>
  );
}
