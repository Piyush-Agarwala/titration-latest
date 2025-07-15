import React, { useState, useEffect } from "react";
import { FlaskConical, Play, Pause, RotateCcw } from "lucide-react";
import { ExperimentSteps } from "./ExperimentSteps";

interface WorkBenchProps {
  onDrop: (id: string, x: number, y: number) => void;
  children: React.ReactNode;
  selectedChemical: string | null;
  isRunning: boolean;
  experimentTitle: string;
  currentGuidedStep?: number;
  dropwiseAnimation?: {
    active: boolean;
    chemicalId: string;
    drops: Array<{ id: string; x: number; y: number; color: string }>;
  };
  isTitrating?: boolean;
  stirringActive?: boolean;
}

interface Step {
  id: number;
  title: string;
  description: string;
  duration: number;
  status: "pending" | "active" | "completed" | "warning";
  requirements?: string[];
}

export const WorkBench: React.FC<WorkBenchProps> = ({
  onDrop,
  children,
  selectedChemical,
  isRunning,
  experimentTitle,
  currentGuidedStep = 1,
  dropwiseAnimation = { active: false, chemicalId: "", drops: [] },
  isTitrating = false,
  stirringActive = false,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [temperature, setTemperature] = useState(22);
  const [volume, setVolume] = useState(0);
  const [solutionColor, setSolutionColor] = useState("#E3F2FD");
  const [isStirring, setIsStirring] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [bubbling, setBubbling] = useState(false);
  const [timer, setTimer] = useState(0);
  const [autoProgress, setAutoProgress] = useState(false);

  const experimentSteps: Step[] = [
    {
      id: 1,
      title: "Setup Equipment",
      description: "Arrange burette, conical flask, and magnetic stirrer",
      duration: 2,
      status:
        currentStep === 1
          ? "active"
          : currentStep > 1
            ? "completed"
            : "pending",
      requirements: [
        "Burette with clamp",
        "250mL conical flask",
        "Magnetic stirrer",
      ],
    },
    {
      id: 2,
      title: "Prepare Solutions",
      description: "Fill burette with NaOH solution and add HCl to flask",
      duration: 3,
      status:
        currentStep === 2
          ? "active"
          : currentStep > 2
            ? "completed"
            : "pending",
      requirements: [
        "0.1M NaOH solution",
        "25mL 0.1M HCl",
        "Phenolphthalein indicator",
      ],
    },
    {
      id: 3,
      title: "Add Indicator",
      description: "Add 2-3 drops of phenolphthalein to the acid solution",
      duration: 1,
      status:
        currentStep === 3
          ? "active"
          : currentStep > 3
            ? "completed"
            : "pending",
      requirements: ["Phenolphthalein indicator"],
    },
    {
      id: 4,
      title: "Begin Titration",
      description: "Start adding NaOH dropwise while stirring continuously",
      duration: 8,
      status:
        currentStep === 4
          ? "active"
          : currentStep > 4
            ? "completed"
            : "pending",
      requirements: ["Continuous stirring", "Slow addition of base"],
    },
    {
      id: 5,
      title: "Approach End Point",
      description: "Add base drop by drop as color changes become visible",
      duration: 5,
      status:
        currentStep === 5
          ? "active"
          : currentStep > 5
            ? "completed"
            : "pending",
      requirements: ["Very slow addition", "Careful observation"],
    },
    {
      id: 6,
      title: "Detect End Point",
      description: "Stop when permanent pink color appears",
      duration: 2,
      status:
        currentStep === 6
          ? "active"
          : currentStep > 6
            ? "completed"
            : "pending",
      requirements: ["Permanent color change"],
    },
    {
      id: 7,
      title: "Record Results",
      description: "Note the volume of NaOH used and calculate concentration",
      duration: 3,
      status:
        currentStep === 7
          ? "active"
          : currentStep > 7
            ? "completed"
            : "pending",
      requirements: ["Accurate volume reading"],
    },
    {
      id: 8,
      title: "Repeat Titration",
      description: "Perform 2-3 more titrations for accuracy",
      duration: 15,
      status:
        currentStep === 8
          ? "active"
          : currentStep > 8
            ? "completed"
            : "pending",
      requirements: ["Fresh solutions", "Clean equipment"],
    },
  ];

  // Auto-progress through experiment steps
  useEffect(() => {
    if (isRunning && autoProgress) {
      const stepDuration = experimentSteps[currentStep - 1]?.duration || 5;
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1);

        // Progress to next step based on duration
        if (timer >= stepDuration * 60) {
          // Convert minutes to seconds
          if (currentStep < experimentSteps.length) {
            setCurrentStep((prev) => prev + 1);
            setTimer(0);
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isRunning, autoProgress, currentStep, timer, experimentSteps]);

  // Step-specific animations and effects
  useEffect(() => {
    switch (currentStep) {
      case 1: // Setup
        setIsStirring(false);
        setIsDropping(false);
        setBubbling(false);
        break;
      case 2: // Prepare solutions
        setVolume(0);
        setSolutionColor("#FFE135"); // HCl color
        break;
      case 3: // Add indicator
        setSolutionColor("#FFCCCB"); // Slight pink tint
        break;
      case 4: // Begin titration
        setIsStirring(true);
        setIsDropping(true);
        // Gradually increase volume
        const volumeInterval = setInterval(() => {
          setVolume((prev) => {
            if (prev < 20) return prev + 0.5;
            return prev;
          });
        }, 2000);
        setTimeout(() => clearInterval(volumeInterval), 20000);
        break;
      case 5: // Approach end point
        setIsDropping(true);
        setSolutionColor("#FFB6C1"); // Light pink
        setBubbling(true);
        break;
      case 6: // End point
        setIsDropping(false);
        setSolutionColor("#FF69B4"); // Bright pink
        setBubbling(false);
        break;
      case 7: // Record results
        setIsStirring(false);
        break;
      case 8: // Repeat
        // Reset for next titration
        setTimeout(() => {
          setVolume(0);
          setSolutionColor("#FFE135");
          setCurrentStep(2);
        }, 3000);
        break;
    }
  }, [currentStep]);

  const handleStepClick = (stepId: number) => {
    setCurrentStep(stepId);
    setTimer(0);
  };

  const handleAutoProgress = () => {
    setAutoProgress(!autoProgress);
  };

  const handleReset = () => {
    // Reset all workbench state to initial values
    setCurrentStep(1);
    setTimer(0);
    setTemperature(22);
    setVolume(0);
    setSolutionColor("#E3F2FD");
    setIsStirring(false);
    setIsDropping(false);
    setBubbling(false);
    setAutoProgress(false);

    // Trigger parent reset callback if available
    // This ensures the main app state is also reset
    console.log("WorkBench reset completed");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // Add visual feedback for drop zone
    const target = e.currentTarget as HTMLElement;
    target.style.backgroundColor = "rgba(59, 130, 246, 0.02)";
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Remove visual feedback
    const target = e.currentTarget as HTMLElement;
    target.style.backgroundColor = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    // Remove visual feedback
    const target = e.currentTarget as HTMLElement;
    target.style.backgroundColor = "";

    // Get equipment data
    const equipmentId = e.dataTransfer.getData("equipment");
    const id = equipmentId || e.dataTransfer.getData("text/plain");

    if (id) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Ensure minimum distance from edges for better positioning
      const adjustedX = Math.max(80, Math.min(rect.width - 80, x));
      const adjustedY = Math.max(80, Math.min(rect.height - 80, y));

      onDrop(id, adjustedX, adjustedY);
    }
  };

  return (
    <div className="w-full h-full">
      {/* Main Lab Bench - Full Width and Much Larger */}
      <div className="w-full h-full">
        <div className="bg-white rounded-lg shadow-lg border h-full">
          <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FlaskConical className="mr-3" size={28} />
                <div>
                  <h2 className="text-2xl font-bold">Virtual Chemistry Lab</h2>
                  <p className="text-sm opacity-90">
                    Interactive Titration Workspace
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative w-full overflow-hidden border-2 border-dashed border-blue-200 rounded-lg"
            style={{
              height: "calc(75vh - 160px)", // Adjusted for top/bottom bars
              minHeight: "500px",
            }}
          >
            {/* Placement guidance text */}
            {React.Children.count(children) === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                  <div className="text-lg font-medium mb-2">
                    🧪 Virtual Lab Workspace
                  </div>
                  <div className="text-sm">
                    Drag equipment from above to set up your experiment
                  </div>
                  <div className="text-xs mt-1 text-blue-600">
                    ��� Place burette and conical flask anywhere you like!
                  </div>
                </div>
              </div>
            )}

            {/* Helpful hints for Aspirin Synthesis */}
            {experimentTitle.includes("Aspirin") && (
              <div className="absolute top-6 left-6 bg-blue-100 border-2 border-blue-300 rounded-lg p-4 max-w-sm z-20">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-blue-800 text-sm">
                    Step {currentGuidedStep}
                  </span>
                </div>
                <div className="text-xs text-blue-700">
                  {currentGuidedStep === 1 &&
                    "Drag the Erlenmeyer Flask to the workbench to begin"}
                  {currentGuidedStep === 2 && "Add Salicylic Acid to the flask"}
                  {currentGuidedStep === 3 &&
                    "Add Acetic Anhydride to the flask"}
                  {currentGuidedStep === 4 && "Add Phosphoric Acid catalyst"}
                  {currentGuidedStep === 5 &&
                    "Set up the Water Bath for heating"}
                  {currentGuidedStep === 6 && "Heat the reaction mixture"}
                  {currentGuidedStep > 6 &&
                    "Aspirin synthesis steps completed!"}
                </div>
              </div>
            )}

            {/* Dropwise Animation Layer */}
            {dropwiseAnimation.active && (
              <div className="absolute inset-0 pointer-events-none z-30">
                {dropwiseAnimation.drops.map((drop) => (
                  <div
                    key={drop.id}
                    className="absolute w-3 h-3 rounded-full shadow-lg transform transition-all ease-in"
                    style={{
                      backgroundColor: drop.color,
                      left: drop.x - 6, // Center the drop
                      top: drop.y,
                      boxShadow: `0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.5)`,
                      animation: "dropFall 1.5s ease-in forwards",
                    }}
                  >
                    {/* Drop highlight for realistic effect */}
                    <div className="absolute top-0 left-1 w-1 h-1 bg-white rounded-full opacity-70"></div>
                  </div>
                ))}

                {/* Inject CSS animation directly */}
                <style
                  dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes dropFall {
                      0% {
                        transform: translateY(0) scale(1);
                        opacity: 1;
                      }
                      50% {
                        transform: translateY(120px) scale(1.1);
                        opacity: 0.8;
                      }
                      100% {
                        transform: translateY(200px) scale(0.8);
                        opacity: 0;
                      }
                    }
                  `,
                  }}
                />
              </div>
            )}

            {/* Equipment placement area with more generous spacing */}
            <div className="absolute inset-0 p-12">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
