
import { useUserRole, type TestResult } from '../../services/useUserRole';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { TestResultsTable } from './TestResultsTable';
import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';

// 1. Define the specific interface for the data returned by the Supabase JOIN query
interface RawTestResult {
  id: number;
  scaled_score: number;
  completed_at: string;
  // Supabase returns related table data as nested objects
  tests: { title: string } | null;
  sections: { section_type: string } | null;
}

export function StudentDashboardView() {
  // Destructure the profile from the imported hook
  const { profile } = useUserRole();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.id) {
      fetchTestResults(profile.id);
    }
  }, [profile?.id]);

  async function fetchTestResults(studentId: string) {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('test_results')
        .select(
          `
          id,
          scaled_score,
          completed_at,
          test_id,
          section_id
        `
        )
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      // 2. Map and cast the data using the specific RawTestResult interface
      const rawData = data as unknown as RawTestResult[];

      const formattedResults: TestResult[] = rawData.map((item) => ({
        id: item.id,
        test_title: item.tests?.title || 'Unknown Test',
        section_type: item.sections?.section_type || 'Overall',
        scaled_score: item.scaled_score,
        completed_at: item.completed_at,
      }));

      setResults(formattedResults);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load test results.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-6 text-indigo-700">
        Welcome Back, {profile?.name || 'Student'}!
      </h1>
      <Card className="shadow-2xl border-indigo-200">
        <CardHeader className="bg-indigo-50/50 rounded-t-xl">
          <CardTitle className="text-xl text-indigo-800">
            Your Recent Scores
          </CardTitle>
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
              <p>Loading results...</p>
            </div>
          ) : error ? (
            <p className="text-red-500 p-4">Error loading data: {error}</p>
          ) : (
            <TestResultsTable results={results} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
