// src/components/EnglishSectionPage.tsx

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
  passage_id: number | null;
  answer_choices: AnswerChoice[];
  question_context: string | null;
}

const EnglishSectionPage: React.FC = () => {
  const { testId, sectionId } = useParams<{
    testId: string;
    sectionId: string;
  }>();

  const [section, setSection] = useState<Section | null>(null);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [questionsByPassage, setQuestionsByPassage] = useState<{
    [passageId: number]: Question[];
  }>({});
  const [questionsWithoutPassage, setQuestionsWithoutPassage] = useState<
    Question[]
  >([]);
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
          .eq('section_id', parseInt(sectionId));

        if (questionsError) throw questionsError;

        const groupedQuestions: { [passageId: number]: Question[] } = {};
        const standaloneQuestions: Question[] = [];

        questionsData?.forEach((q) => {
          const questionWithChoices = {
            ...q,
            answer_choices: q.answer_choices || [],
          } as Question;

          if (questionWithChoices.passage_id) {
            if (!groupedQuestions[questionWithChoices.passage_id]) {
              groupedQuestions[questionWithChoices.passage_id] = [];
            }
            groupedQuestions[questionWithChoices.passage_id].push(
              questionWithChoices
            );
          } else {
            standaloneQuestions.push(questionWithChoices);
          }
        });

        // Sort questions within each group by their ID
        Object.keys(groupedQuestions).forEach((passageId) => {
          groupedQuestions[parseInt(passageId)].sort((a, b) => a.id - b.id);
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

  const handleNextPassage = () => {
    setCurrentPassageIndex((prevIndex) => prevIndex + 1);
  };

  const handlePreviousPassage = () => {
    setCurrentPassageIndex((prevIndex) => prevIndex - 1);
  };

  const handleUserAnswer = (questionId: number, answerChoiceId: number) => {
    setUserAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: answerChoiceId,
    }));
  };

  const handleSubmit = () => {
    let correctAnswersCount = 0;
    const report: {
      questionId: number;
      isCorrect: boolean;
      userAnswer: number;
      correctAnswer: number;
    }[] = [];

    const allQuestions = [...questionsWithoutPassage];
    passages.forEach((p) => {
      if (questionsByPassage[p.id]) {
        allQuestions.push(...questionsByPassage[p.id]);
      }
    });

    allQuestions.forEach((question) => {
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
        correctAnswer: correctAnswerId ?? -1,
      });
    });

    setScore({
      correct: correctAnswersCount,
      total: allQuestions.length,
    });
    setAnswerReport(report);
    setShowReport(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-700">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
            const allQuestions = [...questionsWithoutPassage];
            passages.forEach((p) => {
              if (questionsByPassage[p.id]) {
                allQuestions.push(...questionsByPassage[p.id]);
              }
            });
            const question = allQuestions.find((q) => q.id === item.questionId);
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

  const currentPassageQuestions = currentPassage
    ? questionsByPassage[currentPassage.id] || []
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">
        Test {testId}: {section?.type} Section
      </h1>
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

      <div className="max-w-6xl mx-auto">
        {passages.length === 0 && questionsWithoutPassage.length === 0 ? (
          <p className="text-center text-gray-600 text-xl">
            No content found for this section.
          </p>
        ) : (
          <div className="space-y-12">
            {/* Render only the current passage and its questions */}
            {currentPassage && (
              <div
                key={currentPassage.id}
                className="bg-white shadow-lg rounded-lg p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Passage
                </h2>
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Passage column */}
                  <div className="md:w-1/2 p-4 bg-gray-100 rounded-md overflow-y-auto max-h-[80vh]">
                    <p className="text-gray-800 leading-loose whitespace-pre-wrap">
                      {currentPassage.passage_text}
                    </p>
                  </div>

                  {/* Questions column */}
                  <div className="md:w-1/2 space-y-8 max-h-[80vh] overflow-y-auto">
                    <h3 className="text-xl font-bold text-gray-800">
                      Questions for this Passage
                    </h3>
                    {currentPassageQuestions.length > 0 ? (
                      currentPassageQuestions.map((question, index) => (
                        <div
                          key={question.id}
                          className="bg-gray-50 shadow-sm rounded-lg p-4 border border-gray-200"
                        >
                          <h4 className="text-lg font-semibold text-gray-700 mb-2">
                            Question {index + 1}
                          </h4>
                          {question.question_context && (
                            <h6 className="p-4 border bg-gray-200">
                              {question.question_context}
                            </h6>
                          )}
                          <p className="text-gray-700 mb-3">{question.text}</p>
                          {question.image_url && (
                            <div className="mb-3">
                              <img
                                src={question.image_url}
                                alt={`Question ${question.id} related`}
                                className="max-w-full h-auto rounded-md"
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
                                .sort((a, b) => a.order - b.order)
                                .map((choice) => (
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
              </div>
            )}
            {/* Pagination Controls */}
            <div className="flex justify-between mt-6">
              <button
                onClick={handlePreviousPassage}
                disabled={currentPassageIndex === 0}
                className="px-6 py-2 bg-gray-300 rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-lg self-center">
                Passage {currentPassageIndex + 1} of {passages.length}
              </span>
              {isLastPassage ? (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-green-600 text-white rounded-md"
                >
                  Submit
                </button>
              ) : (
                <button
                  onClick={handleNextPassage}
                  disabled={currentPassageIndex >= passages.length - 1}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
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

export default EnglishSectionPage;