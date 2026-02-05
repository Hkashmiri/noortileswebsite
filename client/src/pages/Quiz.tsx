import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useLevel } from "@/hooks/use-levels";
import { GameData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, ArrowRight, Home, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Quiz() {
  const [match, params] = useRoute("/quiz/:id");
  const [, setLocation] = useLocation();
  const levelId = parseInt(params?.id || "0");
  const { data: level } = useLevel(levelId);

  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const gameData = level?.gameData as GameData;
  const questions = gameData?.quiz || [];
  const currentQuestion = questions[currentQ];

  const handleAnswer = (idx: number) => {
    if (isAnswered) return;
    setSelected(idx);
    setIsAnswered(true);
    if (idx === currentQuestion.correctIndex) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
      setSelected(null);
      setIsAnswered(false);
    } else {
      setIsComplete(true);
    }
  };

  if (!level) return null;

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-xl border-primary/20">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold">Quiz Complete!</h2>
            <p className="text-muted-foreground mt-2">You scored {score} out of {questions.length}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <Button variant="outline" onClick={() => setLocation(`/play/${levelId}`)}>
               <RotateCcw className="mr-2 w-4 h-4" /> Replay
             </Button>
             <Button onClick={() => setLocation('/dashboard')}>
               <Home className="mr-2 w-4 h-4" /> Dashboard
             </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-8">
        {/* Progress Header */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Question {currentQ + 1}/{questions.length}</span>
            <span className="text-primary">{Math.round(((currentQ + 1) / questions.length) * 100)}%</span>
          </div>
          <Progress value={((currentQ + 1) / questions.length) * 100} className="h-2" />
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-6 md:p-8 shadow-xl border-t-4 border-t-primary">
              <h3 className="text-xl md:text-2xl font-bold font-display mb-8 leading-relaxed">
                {currentQuestion?.question}
              </h3>

              <div className="space-y-3">
                {currentQuestion?.options.map((opt, idx) => {
                  const isCorrect = idx === currentQuestion.correctIndex;
                  const isSelected = idx === selected;
                  
                  let variant = "outline";
                  let className = "w-full justify-start text-left h-auto py-4 px-6 text-lg hover:border-primary/50 transition-all";
                  
                  if (isAnswered) {
                    if (isCorrect) {
                      className += " bg-green-500/10 border-green-500 text-green-700 hover:bg-green-500/10";
                    } else if (isSelected) {
                      className += " bg-red-500/10 border-red-500 text-red-700 hover:bg-red-500/10";
                    } else {
                      className += " opacity-50";
                    }
                  }

                  return (
                    <Button
                      key={idx}
                      variant="outline"
                      className={className}
                      onClick={() => handleAnswer(idx)}
                      disabled={isAnswered}
                    >
                      <span className="w-8 h-8 rounded-full border flex items-center justify-center mr-4 text-sm font-bold opacity-50">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                      {isAnswered && isCorrect && <CheckCircle className="ml-auto w-5 h-5 text-green-600" />}
                      {isAnswered && isSelected && !isCorrect && <XCircle className="ml-auto w-5 h-5 text-red-600" />}
                    </Button>
                  );
                })}
              </div>

              {isAnswered && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 pt-6 border-t"
                >
                  {currentQuestion.explanation && (
                    <p className="text-muted-foreground text-sm mb-4 bg-muted/50 p-3 rounded-lg">
                      💡 <strong>Explanation:</strong> {currentQuestion.explanation}
                    </p>
                  )}
                  <Button className="w-full" size="lg" onClick={nextQuestion}>
                    {currentQ === questions.length - 1 ? "Finish" : "Next Question"} 
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
