import { useNavigate } from "react-router-dom";


export default function ServicesPage() {

const navigate = useNavigate();

  return (
    <>
      <div className="min-h-screen bg-gray-200 p-8">
        <h1 className="text-2xl font-bold text-center mt-8">Services Page</h1>
        <p className="text-center mt-4">
          This is where you can find information about our services.
        </p>
        <div className="flex justify-center mt-8 space-x-4">
          <button onClick={() => navigate('/practice-test')} className="bg-green-800 hover:bg-green-700 rounded-full p-4 mx-8">
            Take a Practice Test
          </button>
          <button className="bg-green-800 hover:bg-green-700 rounded-full p-4 mx-8">
            Sample Test Questions
          </button>
        </div>
      </div>
    </>
  );
}
