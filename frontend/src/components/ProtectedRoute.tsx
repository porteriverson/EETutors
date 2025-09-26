import { useUserRole } from '../services/useUserRole';
import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  element: React.ReactElement;
}

export function ProtectedRoute({ element }: ProtectedRouteProps) {
  const { role, isLoading } = useUserRole();

  if (isLoading) {
    // Or render a full-screen spinner if the app is still fetching auth status
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
        <p className="ml-3 text-lg text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  // Redirect to login if the role is 'guest' (unauthenticated)
  if (role === 'guest') {
    return <Navigate to="/auth/login" replace />;
  }

  // If authenticated, render the component
  return element;
}
