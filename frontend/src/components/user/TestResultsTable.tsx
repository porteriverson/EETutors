import type { TestResult } from '@/services/useUserRole';


interface TestResultsTableProps {
  results: TestResult[];
}

export function TestResultsTable({ results }: TestResultsTableProps) {
  if (results.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        You haven't completed any tests yet. Start a practice test to see your
        scores here!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-indigo-200">
        <thead className="bg-indigo-50">
          <tr className="text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">
            <th className="px-6 py-3">Test Name</th>
            <th className="px-6 py-3">Section</th>
            <th className="px-6 py-3">Scaled Score</th>
            <th className="px-6 py-3">Date Completed</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {results.map((result) => (
            <tr
              key={result.id}
              className="hover:bg-indigo-50/50 transition duration-150"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {result.test_title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {result.section_type}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-indigo-600">
                {result.scaled_score}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(result.completed_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
