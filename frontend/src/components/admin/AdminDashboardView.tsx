import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { StudentsTable } from './StudentTable';

// Define the shape of a Student profile based on the 'profiles' table
interface StudentProfile {
  id: string; // UUID
  name: string;
  username: string; // TEXT
  role: 'admin' | 'student'; // TEXT
  teacher_id: string | null; // UUID (Foreign Key to another profile's ID)
}

export function AdminDashboardView() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true);
        setError(null);

        // Fetch user profiles where the role is 'student'
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, username, role, teacher_id')
          .eq('role', 'student');

        if (error) {
          throw error;
        }

        setStudents(data as StudentProfile[]);
      } catch (e: unknown) {
        setError(
          e instanceof Error
            ? e.message
            : 'An unknown error occurred while fetching students.'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, []);

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Current Students Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <svg
                className="animate-spin h-5 w-5 text-indigo-600 mr-2"
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
              <p>Loading students...</p>
            </div>
          ) : error ? (
            <p className="text-red-500 p-4 bg-red-50 rounded-lg border border-red-200">
              Error: {error}
            </p>
          ) : (
            <StudentsTable students={students} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
