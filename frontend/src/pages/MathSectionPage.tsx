// src/pages/MathSectionPage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import Timer from '../components/Timer'; // Import the new Timer component

// Define interfaces for data you'll fetch (same as EnglishSectionPage)
interface Section {
  id: number;
  type: string;
  instructions: string;
  time_minutes: number;
  order: number;
  number_of_questions: number;
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
  passage_id: number | null; // Math questions typically don't have passages
  answer_choices: AnswerChoice[];
  question_context: string | null;
}

const MathSectionPage: React.FC = () => {
  const { testId, sectionId } = useParams<{
    testId: string;
    sectionId: string;
  }>();

  const [section, setSection] = useState<Section | null>(null);
  const [allSortedQuestions, setAllSortedQuestions] = useState<Question[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const questionsPerPage = 10; // Display 10 questions at a time

  const [userAnswers, setUserAnswers] = useState<{
    [questionId: number]: number;
  }>({});
  const [showReport, setShowReport] = useState(false);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(
    null
  );
  const [answerReport, setAnswerReport] = useState<
    {
      questionId: number;
      isCorrect: boolean;
      userAnswer: number;
      correctAnswer: number;
    }[]
  >([]);

  // State to manage the currently active question for image/context display
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  // State for the 5-minute warning message
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Define timerKey for this section
  const timerKey = `test_${testId}_section_${sectionId}`;

  // Function to handle user submitting the section (moved before handleTimeUp)
  const handleSubmit = useCallback(() => {
    let correctAnswersCount = 0;
    const report: {
      questionId: number;
      isCorrect: boolean;
      userAnswer: number;
      correctAnswer: number;
    }[] = [];

    allSortedQuestions.forEach((question) => {
      const userAnswerId = userAnswers[question.id];
      const correctAnswerId = question.correct_answer_choice_id;

      const isCorrect = userAnswerId === correctAnswerId;
      if (isCorrect) {
        correctAnswersCount++;
      }

      report.push({
        questionId: question.id,
        isCorrect,
        userAnswer: userAnswerId,
        correctAnswer: correctAnswerId ?? -1, // Use -1 or another indicator if correct_answer_choice_id is null
      });
    });

    setScore({
      correct: correctAnswersCount,
      total: allSortedQuestions.length,
    });
    setAnswerReport(report);
    setShowReport(true);

    // --- Clear timer state from localStorage on submission ---
    localStorage.removeItem(`timerEndTime_${timerKey}`);
    localStorage.removeItem(`timerWarningShown_${timerKey}`);
    // --- End Clear timer state ---

  }, [allSortedQuestions, userAnswers, timerKey]); // Add timerKey to dependencies

  // Function to handle timer reaching zero
  const handleTimeUp = useCallback(() => {
    // Automatically submit the section when time is up
    handleSubmit();
    console.log("Time's up! Section submitted automatically.");
  }, [handleSubmit]); // Include handleSubmit in dependencies

  // Function to handle 5-minute warning
  const handleFiveMinuteWarning = useCallback(() => {
    setShowWarningModal(true);
    // Hide the modal after a few seconds
    setTimeout(() => {
      setShowWarningModal(false);
    }, 3000); // Show for 3 seconds
  }, []);

  useEffect(() => {
    const fetchSectionAndQuestions = async () => {
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

        // Fetch all questions for this section (Math questions are typically standalone)
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select(
            `
            id,
            text,
            image_url,
            correct_answer_choice_id,
            question_context,
            passage_id,
            answer_choices!answer_choices_question_id_fkey (
              id,
              text,
              order
            )
          `
          )
          .eq('section_id', sectionData.id) // Use sectionData.id here
          .is('passage_id', null) // Ensure only standalone questions are fetched for Math
          .order('id', { ascending: true }); // Order by ID for consistent pagination

        if (questionsError) throw questionsError;

        // Ensure answer choices are sorted for each question
        const processedQuestions = (questionsData || []).map((q) => ({
          ...q,
          answer_choices: (q.answer_choices || []).sort((a, b) => a.order - b.order),
        })) as Question[];

        setAllSortedQuestions(processedQuestions);
        // Set the active question to the first one on the first page initially
        if (processedQuestions.length > 0) {
          setActiveQuestionId(processedQuestions[0].id);
        }

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

    fetchSectionAndQuestions();
  }, [testId, sectionId]); // Dependencies for useEffect

  // Calculate questions for the current page
  const startIndex = currentPage * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentQuestions = allSortedQuestions.slice(startIndex, endIndex);

  const totalPages = Math.ceil(allSortedQuestions.length / questionsPerPage);
  const isLastPage = currentPage === totalPages - 1;
  const isFirstPage = currentPage === 0;

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prevPage) => prevPage + 1);
      setActiveQuestionId(currentQuestions[0]?.id || null); // Set active to first question on new page
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on page change
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prevPage) => prevPage - 1);
      setActiveQuestionId(currentQuestions[0]?.id || null); // Set active to first question on new page
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on page change
    }
  };

  const handleUserAnswer = (questionId: number, answerChoiceId: number) => {
    setUserAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: answerChoiceId,
    }));
  };

  // Find the active question object to display its image/context
  const activeQuestion = allSortedQuestions.find(
    (q) => q.id === activeQuestionId
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-xl text-gray-700">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-xl text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (showReport) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">
          Results for {section?.type} Section
        </h1>
        <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-lg p-8 mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800">
            Your Score: {score?.correct} / {score?.total}
          </h2>
        </div>
        <div className="max-w-6xl mx-auto space-y-8">
          {answerReport.map((item) => {
            const question = allSortedQuestions.find((q) => q.id === item.questionId);
            const userAnswerText = question?.answer_choices.find(
              (ac) => ac.id === item.userAnswer
            )?.text;
            const correctAnswerText = question?.answer_choices.find(
              (ac) => ac.id === item.correctAnswer
            )?.text;

            return (
              <div
                key={item.questionId}
                className={`p-6 rounded-lg shadow-md border-2 ${
                  item.isCorrect ? 'border-green-500' : 'border-red-500'
                }`}
              >
                <p className="text-lg font-semibold text-gray-800 mb-2">
                  Question {allSortedQuestions.findIndex(q => q.id === item.questionId) + 1}: {question?.text}
                </p>
                <p
                  className={`text-md mb-1 ${
                    item.isCorrect ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  Your Answer:{' '}
                  <span className="font-bold">
                    {userAnswerText || 'Not answered'}
                  </span>
                </p>
                {!item.isCorrect && (
                  <p className="text-md text-green-700">
                    Correct Answer:{' '}
                    <span className="font-bold">{correctAnswerText}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* 5-minute warning modal */}
      {showWarningModal && (
        <div className="fixed top-0 left-0 right-0 bg-red-100 border-b-2 border-red-400 text-red-800 px-6 py-3 flex items-center justify-center z-50 shadow-md">
          <p className="text-xl font-bold">⏰ 5 Minutes Remaining! ⏰</p>
        </div>
      )}

      <div className="flex justify-between items-center max-w-6xl mx-auto mb-6">
        <h1 className="text-4xl font-extrabold text-gray-900">
          Test {testId}: {section?.type} Section
        </h1>
        {section?.time_minutes !== undefined && section.time_minutes > 0 && (
          <Timer
            initialMinutes={section.time_minutes}
            onTimeUp={handleTimeUp}
            onFiveMinuteWarning={handleFiveMinuteWarning}
            timerKey={timerKey} // Pass the unique timer key
          />
        )}
      </div>

      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Instructions
        </h2>
        <p className="text-gray-600 text-lg">
          Time Allotted: {section?.time_minutes} minutes
        </p>
        <br />
        <p className="text-gray-700 leading-relaxed mb-4">
          {section?.instructions}
        </p>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Left Column: Questions and Answers */}
        <div className="md:w-2/3 space-y-8">
          {currentQuestions.length > 0 ? (
            currentQuestions.map((question) => (
              <div
                key={question.id}
                id={`question-${question.id}`}
                className={`bg-white shadow-lg rounded-lg p-6 border-2 transition-all duration-200 ${
                  activeQuestionId === question.id
                    ? 'border-blue-500'
                    : 'border-gray-200'
                }`}
                onMouseEnter={() => setActiveQuestionId(question.id)}
                // onMouseLeave={() => setActiveQuestionId(null)} // Removed to keep image visible on hover out
                onClick={() => setActiveQuestionId(question.id)} // Also set active on click
              >
                <h4 className="text-lg font-semibold text-gray-700 mb-3">
                  Question {allSortedQuestions.findIndex(q => q.id === question.id) + 1}
                </h4>
                <p className="text-gray-700 mb-4">{question.text}</p>
                <div className="space-y-2">
                  {question.answer_choices.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      No answer choices available.
                    </p>
                  ) : (
                    question.answer_choices.map((choice) => (
                      <div key={choice.id} className="flex items-center">
                        <input
                          type="radio"
                          id={`q${question.id}-c${choice.id}`}
                          name={`question-${question.id}`}
                          value={choice.id}
                          checked={userAnswers[question.id] === choice.id}
                          onChange={() =>
                            handleUserAnswer(question.id, choice.id)
                          }
                          className="form-radio h-4 w-4 text-blue-600"
                        />
                        <label
                          htmlFor={`q${question.id}-c${choice.id}`}
                          className="ml-2 text-gray-700"
                        >
                          {choice.text}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600 text-xl">
              No questions found for this section.
            </p>
          )}

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-8 p-4 bg-white rounded-lg shadow">
            <button
              onClick={handlePreviousPage}
              disabled={isFirstPage}
              className="px-6 py-2 bg-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-400 transition-colors"
            >
              Previous Page
            </button>
            <span className="text-lg text-gray-700">
              Page {currentPage + 1} of {totalPages}
              {section?.number_of_questions && (
                <span className="ml-4">
                  Total Questions: {section.number_of_questions}
                </span>
              )}
            </span>
            {isLastPage ? (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Submit Section
              </button>
            ) : (
              <button
                onClick={handleNextPage}
                disabled={isLastPage}
                className="px-6 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                Next Page
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Image and Context for Active Question */}
        <div className="md:w-1/3 p-6 bg-white shadow-lg rounded-lg flex flex-col items-center justify-center max-h-[80vh] sticky top-8">
          {activeQuestion ? (
            <>
              {activeQuestion.question_context && (
                <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200 text-blue-800 text-center text-sm">
                  <p className="font-semibold mb-1">Question Context:</p>
                  <p>{activeQuestion.question_context}</p>
                </div>
              )}
              {activeQuestion.image_url ? (
                <img
                  src={activeQuestion.image_url}
                  alt={`Question ${activeQuestion.id} related`}
                  className="max-w-full h-auto rounded-md shadow-md object-contain"
                  onError={(e) => {
                    e.currentTarget.src = `https://placehold.co/400x300/e0e0e0/555555?text=Image+Not+Found`;
                    e.currentTarget.alt = 'Image not found';
                  }}
                />
              ) : (
                <p className="text-gray-500 text-center">
                  No image for this question.
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-center">
              Hover over or click a question to see its associated image or context here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MathSectionPage;
