// src/components/TestList.tsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient'; // Ensure this path is correct
import { useNavigate } from 'react-router-dom';


// Define the interface for a Section
interface Section {
  id: number;
  type: string; // e.g., 'English', 'Math', 'Reading', 'Science'
  instructions: string;
  time_minutes: number;
  number_of_questions: number;
  order: number;
}

// Define the interface for a Test, now including the full section objects
interface Test {
  id: number;
  title: string;
  // Supabase will automatically alias these based on the `select` query
  // and return the full section object if the join is successful.
  // We make them nullable because a section might not be found (though unlikely with your FKs).
  english_section: Section | null;
  math_section: Section | null;
  reading_section: Section | null;
  science_section: Section | null;
}

const TestList: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate(); // Initialize useNavigate hook

  useEffect(() => {
    const fetchTestsWithSections = async () => {
      try {
        setLoading(true);
        setError(null); // Clear previous errors

        // Use Supabase's deep select to fetch the related section data.
        // The syntax `alias:foreign_key_column(*)` tells Supabase to join
        // and return all columns from the related table, aliased as 'alias'.
        const { data, error } = await supabase
          .from('tests')
          .select(`
            id,
            title,
            english_section:english_section_id(*),
            math_section:math_section_id(*),
            reading_section:reading_section_id(*),
            science_section:science_section_id(*)
          `);

        if (error) {
          throw error;
        }

        if (data) {
          setTests(data as unknown as Test[]); // Cast the data to our Test interface
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('Error fetching tests with sections:', err.message);
          setError(`Failed to load tests: ${err.message}`);
        } else {
          console.error('An unknown error occurred:', err);
          setError('An unknown error occurred while loading tests.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTestsWithSections();
  }, []); // Empty dependency array means this runs once on component mount

  // Function to handle section selection
  const handleSectionSelect = (testId: number, section: Section) => {
    console.log(`User wants to take ${section.type} section (ID: ${section.id}) of Test (ID: ${testId})`);
    navigate(`/test/${testId}/section/${section.id}`);
    // Here you would typically navigate to a new page,
    // update global state, or trigger a modal to start the test.
    // Example: navigate(`/test/${testId}/section/${section.id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Loading tests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <p className="font-bold">Error:</p>
        <p className="ml-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">ACT Practice Tests</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tests.length === 0 ? (
          <p className="col-span-full text-center text-gray-600 text-xl">No tests found. Please add some data to your Supabase 'tests' and 'sections' tables.</p>
        ) : (
          tests.map((test) => (
            <div key={test.id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{test.title}</h2>
              <p className="text-gray-700 mb-4">Select a section to begin:</p>
              <div className="flex flex-wrap gap-3 mt-auto"> {/* mt-auto pushes buttons to the bottom */}
                {test.english_section && (
                  <button
                    onClick={() => handleSectionSelect(test.id, test.english_section!)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                  >
                    English
                  </button>
                )}
                {test.math_section && (
                  <button
                    onClick={() => handleSectionSelect(test.id, test.math_section!)}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                  >
                    Math
                  </button>
                )}
                {test.reading_section && (
                  <button
                    onClick={() => handleSectionSelect(test.id, test.reading_section!)}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                  >
                    Reading
                  </button>
                )}
                {test.science_section && (
                  <button
                    onClick={() => handleSectionSelect(test.id, test.science_section!)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                  >
                    Science
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TestList;
