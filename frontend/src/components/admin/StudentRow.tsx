// src/components/admin/StudentRow.tsx
import { Button } from '../ui/button'; // Assuming you have a Button component

interface StudentProfile {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'student';
  teacher_id: string | null;
}

interface StudentRowProps {
  student: StudentProfile;
}

export function StudentRow({ student }: StudentRowProps) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {student.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {student.username}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {student.role}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
        {/* Truncate the UUID for display */}
        {student.id.substring(0, 8)}...
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        {/* Placeholder for future actions */}
        <Button variant="outline" size="sm" disabled>
          View Progress
        </Button>
      </td>
    </tr>
  );
}
