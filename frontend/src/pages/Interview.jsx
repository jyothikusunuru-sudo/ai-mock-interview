import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX, RotateCcw } from "lucide-react";

function Interview() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    role,
    experience,
    interviewType,
    difficulty,
    interviewId,
  } = location.state || {};

  // ==========================================
  // STATE
  // ==========================================

  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // AI interviewer voice
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // AI-generated questions
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] =
    useState(true);

  // ==========================================
  // REFS
  // ==========================================

  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  const speechBaseAnswerRef = useRef("");
  const finalSpeechRef = useRef("");

  // IMPORTANT:
  // Prevents speech recognition from
  // restoring the previous answer when
  // we move to the next question.
  const submittingAnswerRef = useRef(false);

  // ==========================================
  // CAMERA + MICROPHONE
  // ==========================================

  useEffect(() => {
    let stream;

    const startCamera = async () => {
      try {
        stream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error(
          "Camera/Microphone access error:",
          error
        );

        alert(
          "Camera and microphone access is required for the AI interview."
        );
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  // ==========================================
  // FETCH AI-GENERATED QUESTIONS
  // ==========================================

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token =
          localStorage.getItem("access_token");

        if (!token) {
          alert(
            "Your session has expired. Please login again."
          );

          navigate("/login");
          return;
        }

        const response = await fetch(
          `http://127.0.0.1:8000/interview-questions/${interviewId}`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          alert(
            data.detail ||
              "Failed to load interview questions."
          );

          return;
        }

        setQuestions(data);
      } catch (error) {
        console.error(
          "Error fetching interview questions:",
          error
        );

        alert(
          "Unable to load interview questions."
        );
      } finally {
        setQuestionsLoading(false);
      }
    };

    if (interviewId) {
      fetchQuestions();
    } else {
      setQuestionsLoading(false);
    }
  }, [interviewId, navigate]);

  // ==========================================
  // CURRENT QUESTION
  // ==========================================

  const currentQuestionText =
    questions[currentQuestion - 1]?.question ||
    "";

  // ==========================================
  // AI INTERVIEWER VOICE
  // ==========================================

  const stopAIQuestionVoice = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    speechSynthesisRef.current = null;
    setIsSpeaking(false);
  };

  const speakQuestion = (text) => {
    if (!voiceEnabled || !text || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "en-IN";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      speechSynthesisRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error("AI voice error:", event);
      setIsSpeaking(false);
      speechSynthesisRef.current = null;
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Speak every new interview question automatically.
  useEffect(() => {
    if (!currentQuestionText || questionsLoading) {
      return;
    }

    if (!voiceEnabled) {
      stopAIQuestionVoice();
      return;
    }

    const timer = setTimeout(() => {
      speakQuestion(currentQuestionText);
    }, 500);

    return () => {
      clearTimeout(timer);

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      speechSynthesisRef.current = null;
      setIsSpeaking(false);
    };
  }, [currentQuestionText, questionsLoading, voiceEnabled]);

  // Stop AI voice when leaving the interview page.
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ==========================================
  // START SPEECH RECOGNITION
  // ==========================================

  const startListening = () => {
    // Stop the AI interviewer while the user is answering.
    stopAIQuestionVoice();

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported in this browser. Please use Google Chrome."
      );

      return;
    }

    // Save whatever the user has already typed.
    speechBaseAnswerRef.current =
      answer.trim();

    // Reset speech for this recording session.
    finalSpeechRef.current = "";

    // This is a new recording session,
    // so submission mode is false.
    submittingAnswerRef.current = false;

    const recognition =
      new SpeechRecognition();

    recognition.continuous = true;

    // Show speech while the user is speaking.
    recognition.interimResults = true;

    // Indian English.
    recognition.lang = "en-IN";

    // Only use the best result.
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);

      console.log(
        "Speech recognition started"
      );
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const transcript =
          event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalSpeechRef.current +=
            transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      const baseAnswer =
        speechBaseAnswerRef.current;

      const confirmedSpeech =
        finalSpeechRef.current.trim();

      const temporarySpeech =
        interimTranscript.trim();

      let combinedAnswer = baseAnswer;

      if (confirmedSpeech) {
        combinedAnswer +=
          (combinedAnswer ? " " : "") +
          confirmedSpeech;
      }

      if (temporarySpeech) {
        combinedAnswer +=
          (combinedAnswer ? " " : "") +
          temporarySpeech;
      }

      setAnswer(
        combinedAnswer.trim()
      );
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);

      // VERY IMPORTANT:
      // If the recognition stopped because
      // we submitted the answer, don't restore
      // the previous answer.
      if (
        submittingAnswerRef.current
      ) {
        console.log(
          "Speech stopped because answer is being submitted."
        );

        return;
      }

      const baseAnswer =
        speechBaseAnswerRef.current;

      const confirmedSpeech =
        finalSpeechRef.current.trim();

      const finalAnswer =
        baseAnswer +
        (baseAnswer && confirmedSpeech
          ? " "
          : "") +
        confirmedSpeech;

      setAnswer(
        finalAnswer.trim()
      );

      console.log(
        "Speech recognition stopped"
      );
    };

    recognitionRef.current =
      recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error(
        "Unable to start speech recognition:",
        error
      );

      setIsListening(false);
    }
  };

  // ==========================================
  // STOP SPEECH RECOGNITION
  // ==========================================

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();

      recognitionRef.current = null;
    }

    setIsListening(false);
  };

  // ==========================================
  // TOGGLE MICROPHONE
  // ==========================================

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // ==========================================
  // TIMER
  // ==========================================

  useEffect(() => {
    if (
      questionsLoading ||
      questions.length === 0
    ) {
      return;
    }

    if (timeLeft <= 0) {
      handleSubmitAnswer();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(
        (previous) => previous - 1
      );
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [
    timeLeft,
    questionsLoading,
    questions.length,
  ]);

  // ==========================================
  // SUBMIT ANSWER + AI EVALUATION
  // ==========================================

  const handleSubmitAnswer = async () => {
    if (submitting) {
      return;
    }

    // Tell speech recognition that
    // we are submitting the current answer.
    submittingAnswerRef.current = true;

    if (!currentQuestionText) {
      submittingAnswerRef.current = false;
      return;
    }

    // Stop speech recognition.
    if (isListening) {
      stopListening();
    }

    // Stop AI interviewer voice before saving the answer.
    stopAIQuestionVoice();

    const cleanedAnswer = answer.trim();

    setSubmitting(true);

    try {
      const token =
        localStorage.getItem("access_token");

      if (!token) {
        alert(
          "Your session has expired. Please login again."
        );

        navigate("/login");

        return;
      }

      // ========================================
      // STEP 1: SAVE ANSWER
      // ========================================

      const answerResponse = await fetch(
        "http://127.0.0.1:8000/answers",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            interview_id:
              interviewId,

            question:
              currentQuestionText,

            answer:
              cleanedAnswer,
          }),
        }
      );

      const answerData =
        await answerResponse.json();

      if (!answerResponse.ok) {
        alert(
          answerData.detail ||
            "Failed to save answer."
        );

        submittingAnswerRef.current =
          false;

        return;
      }

      console.log(
        "Answer saved successfully:",
        answerData
      );

      // ========================================
      // GET SAVED ANSWER ID
      // ========================================

      const answerId =
        answerData.answer_id;

      console.log(
        "Saved answer ID:",
        answerId
      );

      // ========================================
      // STEP 2: AI EVALUATION
      // ========================================

      const evaluationResponse =
        await fetch(
          `http://127.0.0.1:8000/evaluate-answer/${answerId}`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const evaluationData =
        await evaluationResponse.json();

      if (!evaluationResponse.ok) {
        console.error(
          "AI evaluation failed:",
          evaluationData
        );

        alert(
          evaluationData.detail ||
            "AI evaluation failed. Please try again."
        );

        submittingAnswerRef.current =
          false;

        return;
      }

      console.log(
        "AI evaluation successful:",
        evaluationData
      );

      // ========================================
      // CREATE ANSWER + EVALUATION OBJECT
      // ========================================

      const newAnswer = {
        question:
          currentQuestionText,

        answer:
          cleanedAnswer,

        answerId:
          answerId,

        technicalScore:
          evaluationData.technical_score,

        communicationScore:
          evaluationData.communication_score,

        relevanceScore:
          evaluationData.relevance_score,

        clarityScore:
          evaluationData.clarity_score,

        overallScore:
          evaluationData.overall_score,

        feedback:
          evaluationData.feedback,
      };

      // ========================================
      // UPDATE ANSWERS
      // ========================================

      const updatedAnswers = [
        ...answers,
        newAnswer,
      ];

      setAnswers(updatedAnswers);

      console.log(
        "Complete answer + evaluation:",
        newAnswer
      );

      // ========================================
      // NEXT QUESTION
      // ========================================

      if (
        currentQuestion <
        questions.length
      ) {
        setCurrentQuestion(
          currentQuestion + 1
        );

        // Clear previous answer.
        setAnswer("");

        // Reset speech state.
        speechBaseAnswerRef.current =
          "";

        finalSpeechRef.current =
          "";

        // Allow speech recognition
        // for the next question.
        submittingAnswerRef.current =
          false;

        // Reset timer.
        setTimeLeft(60);
      }

      // ========================================
      // INTERVIEW COMPLETED
      // ========================================

      else {
        const result = {
          role,

          experience,

          interviewType,

          difficulty,

          interviewId,

          answers:
            updatedAnswers,

          totalQuestions:
            questions.length,

          completedAt:
            new Date().toISOString(),
        };

        localStorage.setItem(
          "latestInterviewResult",
          JSON.stringify(result)
        );

        console.log(
          "Interview completed:",
          result
        );

        navigate(
          "/interview-complete",
          {
            state: result,
          }
        );
      }

    } catch (error) {

      console.error(
        "Error submitting answer:",
        error
      );

      alert(
        "Unable to connect to the backend."
      );

      submittingAnswerRef.current =
        false;

    } finally {

      setSubmitting(false);

    }
  };

  // ==========================================
  // MISSING INTERVIEW DATA
  // ==========================================

  if (!location.state) {
    return (
      <div className="text-center py-20">

        <h2 className="text-2xl font-bold text-gray-800">
          Interview session not found
        </h2>

        <p className="text-gray-500 mt-2">
          Please start a new interview.
        </p>

        <button
          onClick={() =>
            navigate(
              "/interview-setup"
            )
          }
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Start New Interview
        </button>

      </div>
    );
  }

  // ==========================================
  // LOADING QUESTIONS
  // ==========================================

  if (questionsLoading) {
    return (
      <div className="text-center py-20">

        <div className="inline-block w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>

        <h2 className="text-2xl font-bold text-gray-800 mt-6">
          Preparing your AI interview...
        </h2>

        <p className="text-gray-500 mt-2">
          Loading your personalized interview questions.
        </p>

      </div>
    );
  }

  // ==========================================
  // NO QUESTIONS
  // ==========================================

  if (questions.length === 0) {
    return (
      <div className="text-center py-20">

        <h2 className="text-2xl font-bold text-gray-800">
          No interview questions found
        </h2>

        <p className="text-gray-500 mt-2">
          We couldn't load the questions for this interview.
        </p>

        <button
          onClick={() =>
            navigate(
              "/interview-setup"
            )
          }
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Start New Interview
        </button>

      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div>

      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <div className="mb-6">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-bold text-gray-800">
              AI Interview
            </h1>

            <p className="text-gray-500 mt-2">
              Answer the questions clearly and confidently.
            </p>

          </div>

          <div className="bg-blue-50 text-blue-600 px-5 py-3 rounded-xl">

            <p className="text-xs font-medium">
              Question
            </p>

            <p className="text-xl font-bold">
              {currentQuestion} /{" "}
              {questions.length}
            </p>

          </div>

        </div>

      </div>


      {/* ====================================== */}
      {/* INTERVIEW INFORMATION */}
      {/* ====================================== */}

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-6">

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

          <div>

            <p className="text-xs text-gray-500">
              Role
            </p>

            <p className="font-medium text-gray-800 mt-1">
              {role}
            </p>

          </div>


          <div>

            <p className="text-xs text-gray-500">
              Experience
            </p>

            <p className="font-medium text-gray-800 mt-1">
              {experience}
            </p>

          </div>


          <div>

            <p className="text-xs text-gray-500">
              Type
            </p>

            <p className="font-medium text-gray-800 mt-1">
              {interviewType}
            </p>

          </div>


          <div>

            <p className="text-xs text-gray-500">
              Difficulty
            </p>

            <p className="font-medium text-gray-800 mt-1">
              {difficulty}
            </p>

          </div>


          <div>

            <p className="text-xs text-gray-500">
              Interview ID
            </p>

            <p className="font-medium text-gray-800 mt-1">
              #{interviewId}
            </p>

          </div>

        </div>

      </div>


      {/* ====================================== */}
      {/* MAIN INTERVIEW AREA */}
      {/* ====================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


        {/* ==================================== */}
        {/* CAMERA SECTION */}
        {/* ==================================== */}

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">

          <div className="flex items-center justify-between mb-4">

            <div>

              <h2 className="text-lg font-semibold text-gray-800">
                Your Camera
              </h2>

              <p className="text-sm text-gray-500">
                Camera and microphone are active
              </p>

            </div>

            <div className="flex items-center gap-2">

              <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>

              <span className="text-sm text-green-600 font-medium">
                Live
              </span>

            </div>

          </div>


          {/* CAMERA PREVIEW */}

          <div className="bg-black rounded-2xl overflow-hidden aspect-video">

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

          </div>

        </div>


        {/* ==================================== */}
        {/* QUESTION + ANSWER */}
        {/* ==================================== */}

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          {/* TIMER */}

          <div className="flex items-center justify-between mb-6">

            <span className="text-sm font-medium text-gray-500">
              Time Remaining
            </span>

            <span
              className={`text-lg font-bold ${
                timeLeft <= 10
                  ? "text-red-600"
                  : "text-blue-600"
              }`}
            >
              {timeLeft}s
            </span>

          </div>


          {/* AI VOICE CONTROL */}

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-700">
                AI Interviewer Voice
              </p>
              <p className="text-xs text-gray-500 mt-1">
                The AI will read each question aloud.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (voiceEnabled) {
                  stopAIQuestionVoice();
                  setVoiceEnabled(false);
                } else {
                  setVoiceEnabled(true);
                }
              }}
              disabled={submitting}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                voiceEnabled
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              } ${
                submitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {voiceEnabled ? (
                <Volume2 size={18} />
              ) : (
                <VolumeX size={18} />
              )}

              {voiceEnabled ? "Voice On" : "Voice Off"}
            </button>
          </div>

          {/* QUESTION */}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">

            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-sm text-blue-600 font-medium">
                AI Interviewer
              </p>

              <div className="flex items-center gap-2">
                {isSpeaking && (
                  <span className="text-xs text-blue-600 font-medium animate-pulse">
                    Speaking...
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) {
                      stopAIQuestionVoice();
                    } else {
                      speakQuestion(currentQuestionText);
                    }
                  }}
                  disabled={!voiceEnabled || submitting}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    !voiceEnabled || submitting
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-blue-600 hover:bg-blue-100"
                  }`}
                  title={
                    isSpeaking
                      ? "Stop AI voice"
                      : "Replay interview question"
                  }
                >
                  {isSpeaking ? (
                    <VolumeX size={15} />
                  ) : (
                    <RotateCcw size={15} />
                  )}

                  {isSpeaking ? "Stop" : "Replay"}
                </button>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-800 leading-relaxed">
              {currentQuestionText}
            </h2>

          </div>


          {/* ANSWER AREA */}

          <div className="mt-6">

            <div className="flex items-center justify-between mb-2">

              <label className="text-sm font-medium text-gray-700">
                Your Answer
              </label>


              {/* SPEECH BUTTON */}

              <button
                type="button"
                onClick={
                  toggleListening
                }
                disabled={submitting}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isListening
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                } ${
                  submitting
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >

                {isListening ? (
                  <MicOff size={18} />
                ) : (
                  <Mic size={18} />
                )}

                {isListening
                  ? "Stop Recording"
                  : "Speak Answer"}

              </button>

            </div>


            {/* TEXTAREA */}

            <textarea
              value={answer}
              onChange={(e) => {
                setAnswer(
                  e.target.value
                );

                if (!isListening) {
                  speechBaseAnswerRef.current =
                    e.target.value;
                }
              }}
              placeholder={
                isListening
                  ? "Listening... speak your answer"
                  : "Type your answer here or click Speak Answer"
              }
              rows={8}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />


            {/* LISTENING STATUS */}

            {isListening && (
              <div className="flex items-center gap-2 mt-3 text-sm text-red-600">

                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>

                Listening to your answer...

              </div>
            )}

          </div>


          {/* SUBMIT BUTTON */}

          <button
            onClick={
              handleSubmitAnswer
            }
            disabled={submitting}
            className={`w-full mt-5 py-3 rounded-xl font-semibold transition ${
              submitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >

            {submitting
              ? "Saving Answer..."
              : currentQuestion ===
                questions.length
              ? "Finish Interview"
              : "Submit Answer →"}

          </button>

        </div>

      </div>


      {/* ====================================== */}
      {/* INTERVIEW PROGRESS */}
      {/* ====================================== */}

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">

        <div className="flex items-center justify-between mb-3">

          <p className="text-sm font-medium text-gray-700">
            Interview Progress
          </p>

          <p className="text-sm text-gray-500">
            {Math.round(
              (currentQuestion /
                questions.length) *
                100
            )}
            %
          </p>

        </div>


        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">

          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{
              width: `${
                (currentQuestion /
                  questions.length) *
                  100
              }%`,
            }}
          />

        </div>

      </div>

    </div>
  );
}

export default Interview;