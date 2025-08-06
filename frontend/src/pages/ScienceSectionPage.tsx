// src/pages/ScienceSectionPage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import Timer from '../components/Timer'; // Import the Timer component
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // Import remarkGfm for GitHub Flavored Markdown (tables, etc.)

// Define interfaces for data you'll fetch
interface Section {
  id: number;
  type: string;
  instructions: string;
  time_minutes: number;
  order: number;
  number_of_questions: number;
}

interface Passage {
  context: string | null; // Context for the passage
  id: number;
  title: string;
  passage_text: string; // This will contain Markdown for text, tables, and embedded images
  order: number;
  // image_url is not strictly needed here if all visuals are embedded in passage_text
  // but keeping it for consistency if a main passage image is desired.
  image_url: string | null;
}

interface AnswerChoice {
  id: number;
  text: string;
  order: number;
}

interface Question {
  id: number;
  text: string;
  image_url: string | null; // For question-specific images
  correct_answer_choice_id: number | null;
  passage_id: number | null;
  answer_choices: AnswerChoice[];
  question_context: string | null; // Less common for Science, but kept for schema consistency
}

const ScienceSectionPage: React.FC = () => {
  const { testId, sectionId } = useParams<{
    testId: string;
    sectionId: string;
  }>();

  const [section, setSection] = useState<Section | null>(null);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [questionsByPassage, setQuestionsByPassage] = useState<{
    [passageId: number]: Question[];
  }>({});
  const [allSortedQuestions, setAllSortedQuestions] = useState<Question[]>([]); // Global sorted list of all questions

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
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

  // State for the 5-minute warning message
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Define timerKey for this section
  const timerKey = `test_${testId}_section_${sectionId}`;

  /**
   * Handles the submission of the section, calculates the score,
   * and displays the report.
   */
  const handleSubmit = useCallback(() => {
    let correctAnswersCount = 0;
    const report: {
      questionId: number;
      isCorrect: boolean;
      userAnswer: number;
      correctAnswer: number;
    }[] = [];

    // Iterate through all questions to calculate score and generate report
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
        correctAnswer: correctAnswerId ?? -1, // Use -1 if correct answer is null
      });
    });

    setScore({
      correct: correctAnswersCount,
      total: allSortedQuestions.length,
    });
    setAnswerReport(report);
    setShowReport(true);

    // Clear timer state from localStorage on submission
    localStorage.removeItem(`timerEndTime_${timerKey}`);
    localStorage.removeItem(`timerWarningShown_${timerKey}`);
  }, [allSortedQuestions, userAnswers, timerKey]);

  /**
   * Callback function when the timer reaches zero.
   * Automatically submits the section.
   */
  const handleTimeUp = useCallback(() => {
    handleSubmit();
    console.log("Time's up! Science Section submitted automatically.");
  }, [handleSubmit]);

  /**
   * Callback function for the 5-minute timer warning.
   * Displays a temporary warning modal.
   */
  const handleFiveMinuteWarning = useCallback(() => {
    setShowWarningModal(true);
    setTimeout(() => {
      setShowWarningModal(false);
    }, 3000); // Show for 3 seconds
  }, []);

  /**
   * Fetches section details, passages, and questions from Supabase
   * when the component mounts or testId/sectionId changes.
   */
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

        // Fetch passages for this section, ordered by their 'order' column
        const { data: passagesData, error: passagesError } = await supabase
          .from('passages')
          .select('*')
          .eq('section_id', sectionData.id)
          .order('order', { ascending: true });

        if (passagesError) throw passagesError;
        setPassages(passagesData || []);

        // Fetch all questions for this section, including their answer choices
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
          .eq('section_id', sectionData.id)
          .not('passage_id', 'is', null); // Science questions are always linked to a passage

        if (questionsError) throw questionsError;

        const groupedQuestions: { [passageId: number]: Question[] } = {};
        const tempAllSortedQuestions: Question[] = [];

        // Group questions by passage_id and sort answer choices
        questionsData?.forEach((q) => {
          const questionWithChoices = {
            ...q,
            answer_choices: (q.answer_choices || []).sort((a, b) => a.order - b.order),
          } as Question;

          if (questionWithChoices.passage_id) {
            if (!groupedQuestions[questionWithChoices.passage_id]) {
              groupedQuestions[questionWithChoices.passage_id] = [];
            }
            groupedQuestions[questionWithChoices.passage_id].push(questionWithChoices);
            tempAllSortedQuestions.push(questionWithChoices); // Add to global list for overall numbering
          }
        });

        // Sort questions within each passage by their ID for consistent order
        Object.keys(groupedQuestions).forEach((passageId) => {
          groupedQuestions[parseInt(passageId)].sort((a, b) => a.id - b.id);
        });
        
        // Sort the global list of questions by ID to ensure correct numbering across the entire section
        tempAllSortedQuestions.sort((a, b) => a.id - b.id);


        setQuestionsByPassage(groupedQuestions);
        setAllSortedQuestions(tempAllSortedQuestions);
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
  }, [testId, sectionId]); // Dependencies for useEffect

  /**
   * Handles navigation to the next passage.
   * Scrolls to the top of the page.
   */
  const handleNextPassage = () => {
    setCurrentPassageIndex((prevIndex) => prevIndex + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Handles navigation to the previous passage.
   * Scrolls to the top of the page.
   */
  const handlePreviousPassage = () => {
    setCurrentPassageIndex((prevIndex) => prevIndex - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Updates the user's answer for a specific question.
   */
  const handleUserAnswer = (questionId: number, answerChoiceId: number) => {
    setUserAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: answerChoiceId,
    }));
  };

  // Display loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-xl text-gray-700">Loading Science Section...</p>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-xl text-red-600">Error: {error}</p>
      </div>
    );
  }

  // Display report after submission
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
            const question = allSortedQuestions.find(
              (q) => q.id === item.questionId
            );
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
                  Question: {question?.text}
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

  const currentPassage = passages[currentPassageIndex];
  const isLastPassage = currentPassageIndex === passages.length - 1;
  const isFirstPassage = currentPassageIndex === 0;

  const currentPassageQuestions = currentPassage
    ? questionsByPassage[currentPassage.id] || []
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* 5-minute warning modal */}
      {showWarningModal && (
        <div className="fixed top-0 left-0 right-0 bg-red-100 border-b-2 border-red-400 text-red-800 px-6 py-3 flex items-center justify-center z-50 shadow-md">
          <p className="text-xl font-bold">⏰ 5 Minutes Remaining! ⏰</p>
        </div>
      )}

      {/* Header with Section Title and Timer */}
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

      {/* Section Instructions */}
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

      {/* Main Content Area: Passage and Questions */}
      <div className="max-w-6xl mx-auto">
        {passages.length === 0 ? (
          <p className="text-center text-gray-600 text-xl">
            No content found for this section.
          </p>
        ) : (
          <div className="space-y-12">
            {currentPassage && (
              <div
                key={currentPassage.id}
                className="bg-white shadow-lg rounded-lg p-6"
              >
                {/* Passage Title */}
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Passage {currentPassage.order}
                </h2>
                <h4 className="font-bold text-gray-900 mb-4">{currentPassage.title}</h4>
                <h4 className="border bg-gray-200 text-gray-900 mb-4 p-4">Context: <br /> {currentPassage.context}</h4>
                
                {/* Optional: Main passage image if available */}
                {currentPassage.image_url && (
                  <div className="mb-6 flex justify-center">
                    <img
                      src={currentPassage.image_url}
                      alt={`Passage ${currentPassage.order} main visual`}
                      className="max-w-full h-auto rounded-md shadow-md object-contain"
                      onError={(e) => {
                        e.currentTarget.src = `https://placehold.co/600x400/e0e0e0/555555?text=Passage+Image+Not+Found`;
                        e.currentTarget.alt = 'Passage image not found';
                      }}
                    />
                  </div>
                )}

                {/* Passage Text with Markdown Rendering */}
                {/* This div will contain all text, tables, and embedded images from the Markdown */}
                <div className="p-4 bg-gray-100 rounded-md overflow-y-auto max-h-[60vh] text-gray-800 leading-relaxed markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}
                    components={{
                      // Custom component for images to apply Tailwind classes and error handling
                      img: ({ ...props }) => (
                        <img
                          {...props}
                          className="max-w-150 h-auto rounded-md shadow-md my-4 mx-auto object-contain"
                          onError={(e) => {
                            e.currentTarget.src = `https://placehold.co/400x300/e0e0e0/555555?text=Image+Not+Found`;
                            e.currentTarget.alt = 'Image not found';
                          }}
                        />
                      ),
                      // Custom component for tables to apply basic Tailwind for responsiveness
                      table: ({ ...props }) => (
                        <div className="overflow-x-auto my-4">
                          <table {...props} className="min-w-full bg-white border border-gray-300 rounded-md shadow-sm" />
                        </div>
                      ),
                      th: ({ ...props }) => (
                        <th {...props} className="px-4 py-2 bg-gray-200 text-left text-sm font-semibold text-gray-700 border-b border-gray-300" />
                      ),
                      td: ({ ...props }) => (
                        <td {...props} className="px-4 py-2 border-b border-gray-200 text-sm text-gray-800" />
                      ),
                      // Add more custom components for other HTML elements if needed for specific styling
                    }}
                  >
                    {currentPassage.passage_text}
                  </ReactMarkdown>
                </div>

                {/* Questions for the current passage */}
                <h3 className="text-xl font-bold text-gray-800 mb-6 mt-8">
                  Questions for Passage {currentPassage.order}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {currentPassageQuestions.length > 0 ? (
                    currentPassageQuestions.map((question) => (
                      <div
                        key={question.id}
                        className="bg-gray-50 shadow-sm rounded-lg p-4 border border-gray-200"
                      >
                        <h4 className="text-lg font-semibold text-gray-700 mb-3">
                          Question{' '}
                          {allSortedQuestions.findIndex(
                            (q) => q.id === question.id
                          ) + 1}
                        </h4>
                        <p className="text-gray-700 mb-3">{question.text}</p>
                        {question.image_url && (
                          <div className="mb-3 flex justify-center">
                            <img
                              src={question.image_url}
                              alt={`Question ${question.id} related`}
                              className="max-w-full h-auto rounded-md object-contain"
                              onError={(e) => {
                                e.currentTarget.src = `https://placehold.co/300x200/e0e0e0/555555?text=Image+Not+Found`;
                                e.currentTarget.alt = 'Image not found';
                              }}
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          {question.answer_choices.length === 0 ? (
                            <p className="text-gray-500 text-sm">
                              No answer choices available.
                            </p>
                          ) : (
                            question.answer_choices
                              .map((choice) => ( // Already sorted in useEffect
                                <div
                                  key={choice.id}
                                  className="flex items-center"
                                >
                                  <input
                                    type="radio"
                                    id={`q${question.id}-c${choice.id}`}
                                    name={`question-${question.id}`}
                                    value={choice.id}
                                    checked={
                                      userAnswers[question.id] === choice.id
                                    }
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
                    <p className="text-gray-600">
                      No questions found for this passage.
                    </p>
                  )}
                </div>
              </div>
            )}
            {/* Pagination Controls */}
            <div className="flex justify-between mt-6 p-4 bg-white rounded-lg shadow">
              <button
                onClick={handlePreviousPassage}
                disabled={isFirstPassage}
                className="px-6 py-2 bg-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-400 transition-colors"
              >
                Previous
              </button>
              <span className="text-lg self-center text-gray-700">
                Passage {currentPassageIndex + 1} of {passages.length}
                {section?.number_of_questions && (
                  <span className="ml-4">
                    Total Questions: {section.number_of_questions}
                  </span>
                )}
              </span>
              {isLastPassage ? (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Submit
                </button>
              ) : (
                <button
                  onClick={handleNextPassage}
                  disabled={isLastPassage}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScienceSectionPage;
