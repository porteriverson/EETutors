// src/components/Timer.tsx

import React, { useState, useEffect, useRef } from 'react';

interface TimerProps {
  initialMinutes: number; // The total time in minutes for the section
  onTimeUp: () => void; // Callback function when the timer reaches 0
  onFiveMinuteWarning?: () => void; // Optional callback for 5-minute warning
  timerKey: string; // A unique key for this specific timer (e.g., "testId-sectionId")
}

const Timer: React.FC<TimerProps> = ({ initialMinutes, onTimeUp, onFiveMinuteWarning, timerKey }) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [warningShown, setWarningShown] = useState(false);
  const timerId = useRef<NodeJS.Timeout | null>(null);

  // Refs to hold the latest callback functions without triggering useEffect re-runs
  const onTimeUpRef = useRef(onTimeUp);
  const onFiveMinuteWarningRef = useRef(onFiveMinuteWarning);

  // Update the refs whenever the props change
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
    onFiveMinuteWarningRef.current = onFiveMinuteWarning;
  }, [onTimeUp, onFiveMinuteWarning]);

  useEffect(() => {
    // Clear any existing interval when the component mounts or initialMinutes/timerKey changes
    if (timerId.current) {
      clearInterval(timerId.current);
    }

    if (initialMinutes > 0) {
      let startTimeInSeconds = initialMinutes * 60; // Default start time

      // --- Load state from localStorage ---
      const savedEndTime = localStorage.getItem(`timerEndTime_${timerKey}`);
      if (savedEndTime) {
        const endTime = parseInt(savedEndTime, 10);
        const currentTime = Date.now();
        const remainingTimeMs = endTime - currentTime;

        if (remainingTimeMs > 0) {
          startTimeInSeconds = Math.ceil(remainingTimeMs / 1000);
          // Check if warning was already shown for this saved state
          const savedWarningShown = localStorage.getItem(`timerWarningShown_${timerKey}`);
          setWarningShown(savedWarningShown === 'true');
        } else {
          // Time already expired, trigger onTimeUp immediately
          onTimeUpRef.current();
          return; // Do not start the timer
        }
      } else {
        // If no saved time, store the initial end time
        const initialEndTime = Date.now() + (initialMinutes * 60 * 1000);
        localStorage.setItem(`timerEndTime_${timerKey}`, initialEndTime.toString());
        localStorage.setItem(`timerWarningShown_${timerKey}`, 'false');
      }
      // --- End Load state ---

      setTimeLeft(startTimeInSeconds);

      timerId.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;

          // Update localStorage with the current end time on each tick
          const currentEndTime = Date.now() + (newTime * 1000);
          localStorage.setItem(`timerEndTime_${timerKey}`, currentEndTime.toString());

          if (newTime <= 1) {
            clearInterval(timerId.current as NodeJS.Timeout);
            onTimeUpRef.current();
            localStorage.removeItem(`timerEndTime_${timerKey}`); // Clear on completion
            localStorage.removeItem(`timerWarningShown_${timerKey}`);
            return 0;
          }

          // Check for 5-minute warning
          if (newTime === 5 * 60 && !warningShown) { // Trigger exactly at 5 minutes
            if (onFiveMinuteWarningRef.current) {
              onFiveMinuteWarningRef.current();
            }
            setWarningShown(true);
            localStorage.setItem(`timerWarningShown_${timerKey}`, 'true');
          }

          return newTime;
        });
      }, 1000);
    }

    // Cleanup function: clear the interval when the component unmounts
    return () => {
      if (timerId.current) {
        clearInterval(timerId.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMinutes, timerKey]); // Only initialMinutes and timerKey in dependency array

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
  };

  const timerColorClass = timeLeft <= 60 ? 'text-red-600 font-bold' : 'text-gray-800';

  return (
    <div className={`text-3xl ${timerColorClass} font-mono bg-white p-3 rounded-lg shadow-md border border-gray-200`}>
      {formatTime(timeLeft)}
    </div>
  );
};

export default Timer;
