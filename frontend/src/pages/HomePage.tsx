import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <div className="min-h-screen bg-gray-200 p-8 text-center">
        <h1 className="bg-gray-200 text-4xl font-bold text-gray-800 mb-8">
          ACT Prep Like you've never done before
        </h1>

        <div>
          <button
            onClick={() => navigate('/practice-test')}
            className="bg-green-800 hover:bg-green-700 rounded-full p-4 mx-8"
          >
            Take a Practice Test
          </button>
        </div>
      </div>
    </>
  );
}
