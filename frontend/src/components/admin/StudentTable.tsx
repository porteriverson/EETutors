import { StudentRow } from "./StudentRow";

interface StudentProfile {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'student';
  teacher_id: string | null;
}

interface StudentsTableProps {
  students: StudentProfile[];
}

export function StudentsTable({ students }: StudentsTableProps) {
  if (students.length === 0) {
    return <p className="text-muted-foreground">No students found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <th className="px-6 py-3">Name</th>
            <th className="px-6 py-3">Username/email</th>
            <th className="px-6 py-3">Role</th>
            <th className="px-6 py-3">Student ID</th>
            <th className="px-6 py-3">Actions</th>
            {/* For future functionality */}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {students.map((student) => (
            <StudentRow key={student.id} student={student} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
