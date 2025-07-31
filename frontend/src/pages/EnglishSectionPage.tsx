// src/components/TestSectionPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

// Define interfaces for data you'll fetch
interface Section {
  id: number;
  type: string;
  instructions: string;
  time_minutes: number;
  order: number;
}

interface Passage {
  id: number;
  passage_text: string;
  order: number;
}

interface AnswerChoice {
  id: number;
  text: string;
  order: number;
}

interface Question {
  id: number;
  text: string;
  image_url: string | null;
  correct_answer_choice_id: number | null;
  passage_id: number | null; // Add this
  answer_choices: AnswerChoice[];
}

const EnglishSectionPage: React.FC = () => {
  const { testId, sectionId } = useParams<{ testId: string; sectionId: string }>();

  const [section, setSection] = useState<Section | null>(null);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [questionsByPassage, setQuestionsByPassage] = useState<{ [passageId: number]: Question[] }>({});
  const [questionsWithoutPassage, setQuestionsWithoutPassage] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSectionPassagesAndQuestions = async () => {
      if (!testId || !sectionId) {
        setError('Test ID or Section ID is missing from the URL.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch section details
        const { data: sectionData, error: sectionError } = await supabase
          .from('sections')
          .select('*')
          .eq('id', parseInt(sectionId))
          .single();

        if (sectionError) throw sectionError;
        setSection(sectionData);

        // Fetch passages for this section
        const { data: passagesData, error: passagesError } = await supabase
          .from('passages')
          .select('*')
          .eq('section_id', parseInt(sectionId))
          .order('order', { ascending: true });

        if (passagesError) throw passagesError;
        setPassages(passagesData || []);

        // Fetch all questions for this section
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select(`
            id,
            text,
            image_url,
            correct_answer_choice_id,
            passage_id,
            answer_choices!answer_choices_question_id_fkey (
              id,
              text,
              order
            )
          `)
          .eq('section_id', parseInt(sectionId));

        if (questionsError) throw questionsError;

        // Group questions by their passage_id
        const groupedQuestions: { [passageId: number]: Question[] } = {};
        const standaloneQuestions: Question[] = [];

        questionsData?.forEach(q => {
          if (q.passage_id) {
            if (!groupedQuestions[q.passage_id]) {
              groupedQuestions[q.passage_id] = [];
            }
            groupedQuestions[q.passage_id].push(q as Question);
          } else {
            standaloneQuestions.push(q as Question);
          }
        });

        // Sort questions within each group by their order (assuming you have an order column)
        Object.keys(groupedQuestions).forEach(passageId => {
          groupedQuestions[parseInt(passageId)].sort((a, b) => a.id - b.id); // Or by another 'order' property if you have it
        });
        
        setQuestionsByPassage(groupedQuestions);
        setQuestionsWithoutPassage(standaloneQuestions);

      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('Error fetching data:', err.message);
          setError(`Failed to load section: ${err.message}`);
        } else {
          console.error('An unknown error occurred:', err);
          setError('An unknown error occurred while loading the section.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSectionPassagesAndQuestions();
  }, [testId, sectionId]);

  // ... (component code before return)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">
        Test {testId}: {section?.type} Section
      </h1>
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Instructions</h2>
        <p className="text-gray-600 text-lg">Time Allotted: {section?.time_minutes} minutes</p><br />
        <p className="text-gray-700 leading-relaxed mb-4">{section?.instructions}</p>
      </div>

      <div className="max-w-6xl mx-auto">
        {passages.length === 0 && questionsWithoutPassage.length === 0 ? (
          <p className="text-center text-gray-600 text-xl">No content found for this section.</p>
        ) : (
          <div className="space-y-12">
            {/* Render content with passages */}
            {passages.map((passage) => (
              <div key={passage.id} className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Passage</h2>
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Passage column */}
                  <div className="md:w-1/2 p-4 bg-gray-100 rounded-md overflow-y-auto max-h-[80vh]">
                    <p className="text-gray-800 leading-loose whitespace-pre-wrap">{passage.passage_text}</p>
                  </div>
                  
                  {/* Questions column */}
                  <div className="md:w-1/2 space-y-8">
                    <h3 className="text-xl font-bold text-gray-800">Questions for this Passage</h3>
                    {questionsByPassage[passage.id]?.length > 0 ? (
                      questionsByPassage[passage.id].map((question, index) => (
                        <div key={question.id} className="bg-gray-50 shadow-sm rounded-lg p-4 border border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-700 mb-2">Question {index + 1}</h4>
                          <p className="text-gray-700 mb-3">{question.text}</p>
                          {question.image_url && (
                            <div className="mb-3">
                              <img src={question.image_url} alt={`Question ${question.id} related`} className="max-w-full h-auto rounded-md" />
                            </div>
                          )}
                          <div className="space-y-2">
                            {question.answer_choices.length === 0 ? (
                              <p className="text-gray-500 text-sm">No answer choices available.</p>
                            ) : (
                              question.answer_choices
                                .sort((a, b) => a.order - b.order)
                                .map((choice) => (
                                  <div key={choice.id} className="flex items-center">
                                    <input
                                      type="radio"
                                      id={`q${question.id}-c${choice.id}`}
                                      name={`question-${question.id}`}
                                      value={choice.id}
                                      className="form-radio h-4 w-4 text-blue-600"
                                    />
                                    <label htmlFor={`q${question.id}-c${choice.id}`} className="ml-2 text-gray-700">
                                      {choice.text}
                                    </label>
                                  </div>
                                ))
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600">No questions found for this passage.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Render any standalone questions that are not linked to a passage */}
            {questionsWithoutPassage.length > 0 && (
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">General Questions</h2>
                <div className="space-y-8">
                  {questionsWithoutPassage.map((question, index) => (
                    <div key={question.id} className="bg-gray-50 shadow-sm rounded-lg p-4 border border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">Question {index + 1}</h4>
                      <p className="text-gray-700 mb-3">{question.text}</p>
                      {question.image_url && (
                        <div className="mb-3">
                          <img src={question.image_url} alt={`Question ${question.id} related`} className="max-w-full h-auto rounded-md" />
                        </div>
                      )}
                      <div className="space-y-2">
                        {question.answer_choices.length === 0 ? (
                          <p className="text-gray-500 text-sm">No answer choices available.</p>
                        ) : (
                          question.answer_choices
                            .sort((a, b) => a.order - b.order)
                            .map((choice) => (
                              <div key={choice.id} className="flex items-center">
                                <input
                                  type="radio"
                                  id={`standalone-q${question.id}-c${choice.id}`}
                                  name={`question-${question.id}`}
                                  value={choice.id}
                                  className="form-radio h-4 w-4 text-blue-600"
                                />
                                <label htmlFor={`standalone-q${question.id}-c${choice.id}`} className="ml-2 text-gray-700">
                                  {choice.text}
                                </label>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnglishSectionPage;