import { useUserRole } from '../services/useUserRole';
import { AdminDashboardView } from '../components/admin/AdminDashboardView';
import { Card, CardContent } from '../components/ui/card';
import { StudentDashboardView } from '../components/user/StudentDashboardView';

export function DashboardPage() {
  const { role, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <svg
          className="animate-spin h-8 w-8 text-indigo-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="ml-3 text-lg text-gray-600">
          Authenticating and loading dashboard...
        </p>
      </div>
    );
  }

  // Handle unauthenticated user
  if (role === 'guest') {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-md mx-auto p-6 text-center border-yellow-300 bg-yellow-50">
          <CardContent>
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">
              Access Denied
            </h2>
            <p className="text-gray-700">
              Please{' '}
              <a
                href="/auth/login"
                className="text-indigo-600 hover:underline font-medium"
              >
                log in
              </a>{' '}
              to view your dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 min-h-[calc(100vh-64px)] flex justify-center">
      {/* Conditionally render the correct dashboard view */}
      {role === 'admin' && <AdminDashboardView />}
      {role === 'student' && <StudentDashboardView />}
    </div>
  );
}
