export function buildInterviewResult({
  answers,
  role,
  experience,
  interviewType,
  difficulty,
}) {
  return {
    role,
    experience,
    interviewType,
    difficulty,
    answers,
    totalQuestions: answers.length,
    completedAt: new Date().toISOString(),
  };
}

export function getLatestInterviewResult() {
  const storedResult = localStorage.getItem(
    "latestInterviewResult"
  );

  if (!storedResult) {
    return null;
  }

  return JSON.parse(storedResult);
}