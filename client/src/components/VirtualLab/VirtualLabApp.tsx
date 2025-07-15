import React, { useState, useCallback, useMemo } from "react";
import { Equipment } from "./Equipment";
import { WorkBench } from "./WorkBench";
import { Chemical } from "./Chemical";
import { Controls } from "./Controls";
import { ResultsPanel } from "./ResultsPanel";
import { ExperimentSteps } from "./ExperimentSteps";
import { MeasurementsPanel } from "./MeasurementsPanel";
import { ChemicalFormulas } from "./ChemicalFormulas";
import {
  FlaskConical,
  Atom,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  List,
  Beaker,
  TestTube,
  Thermometer,
  Droplets,
  Erlenmeyer,
  Undo2,
} from "lucide-react";
import type { ExperimentStep } from "@shared/schema";

interface EquipmentPosition {
  id: string;
  x: number;
  y: number;
  chemicals: Array<{
    id: string;
    name: string;
    color: string;
    amount: number;
    concentration: string;
  }>;
}

interface Result {
  id: string;
  type: "success" | "warning" | "error" | "reaction";
  title: string;
  description: string;
  timestamp: string;
  calculation?: {
    volumeAdded?: number;
    totalVolume?: number;
    concentration?: string;
    molarity?: number;
    moles?: number;
    reaction?: string;
    yield?: number;
    ph?: number;
    balancedEquation?: string;
    reactionType?: string;
    products?: string[];
    mechanism?: string[];
    thermodynamics?: {
      deltaH?: number;
      deltaG?: number;
      equilibriumConstant?: number;
    };
  };
}

interface VirtualLabProps {
  step: ExperimentStep;
  onStepComplete: () => void;
  onProgressUpdate?: (
    progressPercentage: number,
    completedSteps: number,
  ) => void;
  onStepProgressUpdate?: (completedSteps: number) => void;
  isActive: boolean;
  stepNumber: number;
  totalSteps: number;
  experimentTitle: string;
  allSteps: ExperimentStep[];
  onTimerStart?: () => void;
  onTimerStop?: () => void;
  onTimerReset?: () => void;
  onProgressReset?: () => void;
}

function VirtualLabApp({
  step,
  onStepComplete,
  onProgressUpdate,
  onStepProgressUpdate,
  isActive,
  stepNumber,
  totalSteps,
  experimentTitle,
  allSteps,
  onTimerStart,
  onTimerStop,
  onTimerReset,
  onProgressReset,
}: VirtualLabProps) {
  const [equipmentPositions, setEquipmentPositions] = useState<
    EquipmentPosition[]
  >([]);
  const [undoHistory, setUndoHistory] = useState<EquipmentPosition[][]>([]);
  const [selectedChemical, setSelectedChemical] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [showSteps, setShowSteps] = useState(true);
  const [currentStep, setCurrentStep] = useState(stepNumber);
  const [measurements, setMeasurements] = useState({
    volume: 0,
    concentration: 0,
    ph: 7,
    molarity: 0,
    moles: 0,
    temperature: 25,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentGuidedStep, setCurrentGuidedStep] = useState(1);
  const [dropwiseAnimation, setDropwiseAnimation] = useState<{
    active: boolean;
    chemicalId: string;
    drops: Array<{ id: string; x: number; y: number; color: string }>;
  }>({ active: false, chemicalId: "", drops: [] });

  // Titration-specific state
  const [isTitrating, setIsTitrating] = useState(false);
  const [isStirring, setIsStirring] = useState(false);
  const [titrationDropCount, setTitrationDropCount] = useState(0);
  const [stirrerActive, setStirerActive] = useState(false);
  const [titrationColorProgress, setTitrationColorProgress] = useState(0);
  const [cumulativeVolume, setCumulativeVolume] = useState(5.0); // Track total volume across multiple titrations
  const [cumulativeColorIntensity, setCumulativeColorIntensity] = useState(0); // Track color intensity across titrations

  // Step completion tracking for Acid-Base Titration
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [hasCalculatedResult, setHasCalculatedResult] = useState(false);
  const [showResultsPanel, setShowResultsPanel] = useState(false);

  // Helper function to mark steps as completed for Acid-Base Titration
  const markStepCompleted = useCallback(
    (stepNumber: number, message: string) => {
      if (
        experimentTitle.includes("Acid-Base") &&
        !completedSteps.has(stepNumber)
      ) {
        // Defer all state updates to next tick to avoid setState-in-render
        setTimeout(() => {
          setCompletedSteps((prev) => {
            const newCompletedSteps = new Set(
              Array.from(prev).concat([stepNumber]),
            );
            const progressPercentage = Math.round(
              (newCompletedSteps.size / allSteps.length) * 100,
            );

            // Update progress when step is completed
            if (onProgressUpdate) {
              onProgressUpdate(progressPercentage, newCompletedSteps.size);
            }
            if (onStepProgressUpdate) {
              onStepProgressUpdate(newCompletedSteps.size);
            }

            return newCompletedSteps;
          });

          setToastMessage(`✅ Step ${stepNumber} completed: ${message}`);
          setTimeout(() => setToastMessage(null), 3000);
        }, 0);
      }
    },
    [
      experimentTitle,
      completedSteps,
      allSteps.length,
      onProgressUpdate,
      onStepProgressUpdate,
    ],
  );

  // Use dynamic experiment steps from allSteps prop
  const experimentSteps = allSteps.map((stepData, index) => ({
    id: stepData.id,
    title: stepData.title,
    description: stepData.description,
    duration: parseInt(stepData.duration?.replace(/\D/g, "") || "5"),
    status: (experimentTitle.includes("Acid-Base")
      ? completedSteps.has(stepData.id)
        ? "completed"
        : stepData.id === currentStep
          ? "active"
          : "pending"
      : stepData.id === currentStep
        ? "active"
        : stepData.id < currentStep
          ? "completed"
          : "pending") as "active" | "completed" | "pending",
    requirements: stepData.safety
      ? [stepData.safety]
      : [`${stepData.title} requirements`],
  }));

  // Experiment-specific chemicals and equipment
  const experimentChemicals = useMemo(() => {
    if (experimentTitle.includes("Aspirin")) {
      return [
        {
          id: "salicylic_acid",
          name: "Salicylic Acid",
          formula: "C₇H₆O���",
          color: "#F8F8FF",
          concentration: "2.0 g",
          volume: 25,
        },
        {
          id: "acetic_anhydride",
          name: "Acetic Anhydride",
          formula: "(CH₃CO)₂O",
          color: "#DDA0DD",
          concentration: "5 mL",
          volume: 50,
        },
        {
          id: "phosphoric_acid",
          name: "Phosphoric Acid",
          formula: "H₃PO₄",
          color: "#FFA500",
          concentration: "Catalyst",
          volume: 10,
        },
        {
          id: "distilled_water",
          name: "Distilled Water",
          formula: "H₂O",
          color: "transparent",
          concentration: "Pure",
          volume: 100,
        },
      ];
    } else if (experimentTitle.includes("Acid-Base")) {
      return [
        {
          id: "naoh",
          name: "Sodium Hydroxide",
          formula: "NaOH",
          color: "#8B5A9B",
          concentration: "0.1 M",
          volume: 50,
        },
        {
          id: "hcl",
          name: "Hydrochloric Acid",
          formula: "HCl",
          color: "#FFE135",
          concentration: "0.1 M",
          volume: 25,
        },
        {
          id: "phenol",
          name: "Phenolphthalein",
          formula: "C₂₀H₁₄O₄",
          color: "#FFB6C1",
          concentration: "Indicator",
          volume: 10,
        },
      ];
    } else if (experimentTitle.includes("Equilibrium")) {
      return [
        {
          id: "cocl2",
          name: "Cobalt(II) Chloride",
          formula: "CoCl₂",
          color: "#FFB6C1",
          concentration: "0.1 M",
          volume: 30,
        },
        {
          id: "hcl_conc",
          name: "Concentrated HCl",
          formula: "HCl",
          color: "#87CEEB",
          concentration: "12 M",
          volume: 20,
        },
        {
          id: "water",
          name: "Distilled Water",
          formula: "H��O",
          color: "transparent",
          concentration: "Pure",
          volume: 100,
        },
        {
          id: "ice",
          name: "Ice Bath",
          formula: "H₂O(s)",
          color: "#E0F6FF",
          concentration: "0°C",
          volume: 50,
        },
      ];
    }
    return [];
  }, [experimentTitle]);

  const experimentEquipment = useMemo(() => {
    if (experimentTitle.includes("Aspirin")) {
      return [
        {
          id: "erlenmeyer_flask",
          name: "125mL Erlenmeyer Flask",
          icon: (
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              className="text-blue-600"
            >
              <path
                d="M12 6h12v8l4 12H8l4-12V6z"
                stroke="currentColor"
                strokeWidth="2"
                fill="rgba(59, 130, 246, 0.1)"
              />
              <path d="M10 6h16" stroke="currentColor" strokeWidth="2" />
              <circle cx="18" cy="20" r="2" fill="rgba(59, 130, 246, 0.3)" />
            </svg>
          ),
        },
        {
          id: "thermometer",
          name: "Thermometer",
          icon: (
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              className="text-red-600"
            >
              <rect
                x="16"
                y="4"
                width="4"
                height="20"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
                fill="rgba(239, 68, 68, 0.1)"
              />
              <circle cx="18" cy="28" r="4" fill="currentColor" />
              <path d="M18 24v-16" stroke="currentColor" strokeWidth="1" />
            </svg>
          ),
        },
        {
          id: "graduated_cylinder",
          name: "Graduated Cylinder",
          icon: (
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              className="text-green-600"
            >
              <rect
                x="12"
                y="6"
                width="12"
                height="24"
                rx="1"
                stroke="currentColor"
                strokeWidth="2"
                fill="rgba(34, 197, 94, 0.1)"
              />
              <path
                d="M14 12h8M14 16h8M14 20h8M14 24h8"
                stroke="currentColor"
                strokeWidth="1"
              />
              <rect
                x="10"
                y="4"
                width="16"
                height="4"
                rx="1"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          ),
        },
        {
          id: "water_bath",
          name: "Water Bath",
          icon: (
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              className="text-orange-600"
            >
              <rect
                x="4"
                y="12"
                width="28"
                height="16"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
                fill="rgba(249, 115, 22, 0.1)"
              />
              <path
                d="M8 20c2-2 4-2 6 0s4 2 6 0s4-2 6 0s4 2 6 0"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="18" cy="8" r="2" fill="rgba(249, 115, 22, 0.5)" />
              <path d="M16 6l4 4" stroke="currentColor" strokeWidth="1" />
            </svg>
          ),
        },
      ];
    } else if (experimentTitle.includes("Acid-Base")) {
      return [
        {
          id: "burette",
          name: "50mL Burette",
          icon: (
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F5b489eed84cd44f89c5431dbe9fd14d3%2F2ad8cf1ef1394deabc2721f0caee85ef?format=webp&width=800"
              alt="Burette"
              className="w-9 h-9 object-contain rounded border-2 border-blue-400 shadow-sm bg-white"
              style={{
                filter: "brightness(1.0) contrast(1.0)",
              }}
            />
          ),
        },
        {
          id: "conical_flask",
          name: "250mL Conical Flask",
          icon: (
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F5b489eed84cd44f89c5431dbe9fd14d3%2F18f408c6f29d4176ac4ae731a3650daa?format=webp&width=800"
              alt="Conical Flask"
              className="w-9 h-9 object-contain rounded border-2 border-blue-400 shadow-sm bg-white"
              style={{
                filter: "brightness(1.0) contrast(1.0)",
              }}
            />
          ),
        },
        {
          id: "magnetic_stirrer",
          name: "Magnetic Stirrer",
          icon: (
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              className="text-gray-600"
            >
              {/* Stirrer base */}
              <rect
                x="4"
                y="20"
                width="28"
                height="12"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
                fill="rgba(107, 114, 128, 0.1)"
              />
              {/* Control knobs */}
              <circle cx="10" cy="26" r="2" fill="currentColor" />
              <circle cx="26" cy="26" r="2" fill="currentColor" />
              {/* Stirring bar */}
              <rect
                x="14"
                y="14"
                width="8"
                height="2"
                rx="1"
                fill="#ef4444"
                className="animate-spin"
                style={{ transformOrigin: "18px 15px" }}
              />
              {/* Base label */}
              <text
                x="18"
                y="30"
                textAnchor="middle"
                fontSize="4"
                fill="currentColor"
              >
                STIRRER
              </text>
            </svg>
          ),
        },
      ];
    } else if (experimentTitle.includes("Equilibrium")) {
      return [
        { id: "test_tubes", name: "Test Tubes", icon: <TestTube size={36} /> },
        { id: "beakers", name: "Beakers", icon: <Beaker size={36} /> },
        {
          id: "hot_water_bath",
          name: "Hot Water Bath",
          icon: <Thermometer size={36} />,
        },
        { id: "ice_bath", name: "Ice Bath", icon: <FlaskConical size={36} /> },
      ];
    }
    return [];
  }, [experimentTitle]);

  // Guided steps for Aspirin Synthesis
  const aspirinGuidedSteps = [
    {
      id: 1,
      title: "Set up Erlenmeyer Flask",
      instruction: "Drag the 125mL Erlenmeyer Flask to the workbench",
      requiredEquipment: "erlenmeyer_flask",
      completed: false,
    },
    {
      id: 2,
      title: "Add Salicylic Acid",
      instruction: "Drag 2.0g of Salicylic Acid into the Erlenmeyer Flask",
      requiredChemical: "salicylic_acid",
      targetEquipment: "erlenmeyer_flask",
      completed: false,
    },
    {
      id: 3,
      title: "Add Acetic Anhydride",
      instruction:
        "Add 5mL of Acetic Anhydride to the flask using the graduated cylinder",
      requiredChemical: "acetic_anhydride",
      targetEquipment: "erlenmeyer_flask",
      completed: false,
    },
    {
      id: 4,
      title: "Add Catalyst",
      instruction: "Add 2-3 drops of Phosphoric Acid as catalyst",
      requiredChemical: "phosphoric_acid",
      targetEquipment: "erlenmeyer_flask",
      completed: false,
    },
    {
      id: 5,
      title: "Set up Water Bath",
      instruction: "Drag the Water Bath to the workbench and heat to 85°C",
      requiredEquipment: "water_bath",
      completed: false,
    },
    {
      id: 6,
      title: "Heat Reaction",
      instruction: "Place the flask in the water bath and heat for 15 minutes",
      completed: false,
    },
  ];

  // Undo functionality
  const saveStateToHistory = useCallback(() => {
    setUndoHistory((prev) => {
      const newHistory = [...prev, equipmentPositions];
      // Keep only last 10 states to prevent memory issues
      return newHistory.slice(-10);
    });
  }, [equipmentPositions]);

  const handleUndo = useCallback(() => {
    if (undoHistory.length > 0) {
      const previousState = undoHistory[undoHistory.length - 1];
      setEquipmentPositions(previousState);
      setUndoHistory((prev) => prev.slice(0, -1));
      setToastMessage("↩️ Last action undone");
      setTimeout(() => setToastMessage(null), 2000);
    }
  }, [undoHistory]);

  // Keyboard shortcut for undo (Ctrl+Z)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo]);

  const handleEquipmentDrop = useCallback(
    (id: string, x: number, y: number) => {
      // Save current state before making changes
      saveStateToHistory();

      setEquipmentPositions((prev) => {
        const existing = prev.find((pos) => pos.id === id);

        // Flexible positioning with smart defaults for first-time placement
        let finalX = x;
        let finalY = y;

        // Ensure equipment stays within reasonable bounds
        const minX = 60;
        const maxX = 800;
        const minY = 60;
        const maxY = 450;

        finalX = Math.max(minX, Math.min(maxX, x));
        finalY = Math.max(minY, Math.min(maxY, y));

        // Enhanced auto-snap formation for titration equipment
        if (experimentTitle.includes("Acid-Base")) {
          const titrationEquipment = [
            "burette",
            "conical_flask",
            "magnetic_stirrer",
          ];

          if (titrationEquipment.includes(id)) {
            // Get positions of other titration equipment already on workbench
            const otherTitrationEquipment = prev.filter(
              (pos) => titrationEquipment.includes(pos.id) && pos.id !== id,
            );

            // Check if dragging near any existing titration equipment
            const snapDistance = 180; // Distance threshold for auto-snap
            let shouldSnapToFormation = false;
            let formationCenterX = finalX;
            let formationCenterY = finalY;

            // If there are other titration equipment pieces, check proximity
            if (otherTitrationEquipment.length > 0) {
              for (const equipment of otherTitrationEquipment) {
                const distance = Math.sqrt(
                  Math.pow(equipment.x - finalX, 2) +
                    Math.pow(equipment.y - finalY, 2),
                );

                if (distance < snapDistance) {
                  shouldSnapToFormation = true;
                  // Use the average position as formation center
                  formationCenterX = equipment.x;
                  formationCenterY = equipment.y;
                  break;
                }
              }
            }

            // Auto-snap to formation when near other equipment or in center area
            const inCenterArea =
              Math.abs(x - 450) < 150 && Math.abs(y - 250) < 200;

            if (shouldSnapToFormation || (!existing && inCenterArea)) {
              // Define the fixed formation positions - exact layout from image
              const formationX = formationCenterX || 450; // Center X position
              const buretteY = 120; // Burette at top
              const flaskY = 280; // Flask in middle
              const stirrerY = 420; // Stirrer at bottom

              const formationPositions = {
                burette: { x: formationX, y: buretteY },
                conical_flask: { x: formationX, y: flaskY },
                magnetic_stirrer: { x: formationX, y: stirrerY },
              };

              // Snap to formation position
              const snapPosition =
                formationPositions[id as keyof typeof formationPositions];
              if (snapPosition) {
                finalX = Math.max(minX, Math.min(maxX, snapPosition.x));
                finalY = Math.max(minY, Math.min(maxY, snapPosition.y));

                // Also update positions of other equipment in formation to align properly
                const updatedPositions = prev.map((pos) => {
                  if (titrationEquipment.includes(pos.id) && pos.id !== id) {
                    const alignPosition =
                      formationPositions[
                        pos.id as keyof typeof formationPositions
                      ];
                    if (alignPosition) {
                      return {
                        ...pos,
                        x: Math.max(minX, Math.min(maxX, alignPosition.x)),
                        y: Math.max(minY, Math.min(maxY, alignPosition.y)),
                      };
                    }
                  }
                  return pos;
                });

                // Update existing equipment positions first
                prev = updatedPositions;
              }
            }
          }
        }

        // Check for overlapping with other equipment (but allow formation)
        const isOverlapping = (
          newX: number,
          newY: number,
          excludeId: string,
        ) => {
          return prev.some((pos) => {
            if (pos.id === excludeId) return false;

            // Allow titration equipment to be close when in formation
            const isTitrationFormation =
              experimentTitle.includes("Acid-Base") &&
              ["burette", "conical_flask", "magnetic_stirrer"].includes(
                pos.id,
              ) &&
              ["burette", "conical_flask", "magnetic_stirrer"].includes(
                excludeId,
              );

            if (isTitrationFormation) {
              return false; // Allow close positioning for formation
            }

            const distance = Math.sqrt(
              Math.pow(pos.x - newX, 2) + Math.pow(pos.y - newY, 2),
            );
            return distance < 120; // Minimum distance between equipment
          });
        };

        // Adjust position if overlapping (but not for formation equipment)
        if (isOverlapping(finalX, finalY, id)) {
          // Try to find a nearby non-overlapping position
          for (let offset = 30; offset <= 150; offset += 30) {
            const testPositions = [
              { x: finalX + offset, y: finalY },
              { x: finalX - offset, y: finalY },
              { x: finalX, y: finalY + offset },
              { x: finalX, y: finalY - offset },
              { x: finalX + offset, y: finalY + offset },
              { x: finalX - offset, y: finalY - offset },
            ];

            for (const testPos of testPositions) {
              const testX = Math.max(minX, Math.min(maxX, testPos.x));
              const testY = Math.max(minY, Math.min(maxY, testPos.y));

              if (!isOverlapping(testX, testY, id)) {
                finalX = testX;
                finalY = testY;
                break;
              }
            }
            if (!isOverlapping(finalX, finalY, id)) break;
          }
        }

        if (existing) {
          return prev.map((pos) =>
            pos.id === id ? { ...pos, x: finalX, y: finalY } : pos,
          );
        }

        // Check if this completes a guided step for Aspirin Synthesis
        if (experimentTitle.includes("Aspirin")) {
          const currentStep = aspirinGuidedSteps[currentGuidedStep - 1];
          if (currentStep?.requiredEquipment === id) {
            setCurrentGuidedStep((prev) => prev + 1);
            setToastMessage(`✓ Step ${currentGuidedStep} completed!`);
            setTimeout(() => setToastMessage(null), 3000);
          }
        }

        // Check for Acid-Base Titration equipment setup completion
        if (experimentTitle.includes("Acid-Base")) {
          // Step 1: Prepare Equipment - when burette is placed (key equipment for this step)
          if (id === "burette") {
            markStepCompleted(1, "Burette equipment prepared");
          }
        }

        // Add equipment at user-specified position
        return [...prev, { id, x: finalX, y: finalY, chemicals: [] }];
      });
    },
    [
      experimentTitle,
      currentGuidedStep,
      aspirinGuidedSteps,
      saveStateToHistory,
      markStepCompleted,
    ],
  );

  const calculateChemicalProperties = (
    chemical: any,
    amount: number,
    totalVolume: number,
  ) => {
    const concentrations: { [key: string]: number } = {
      hcl: 0.1, // 0.1 M HCl
      naoh: 0.1, // 0.1 M NaOH
      phenol: 0, // Indicator (no molarity)
    };

    const molarity = concentrations[chemical.id] || 0;
    const volumeInL = amount / 1000; // Convert mL to L
    const moles = molarity * volumeInL;

    // Calculate pH for acids and bases
    let ph = 7; // neutral
    if (chemical.id === "hcl") {
      ph = -Math.log10(molarity * (amount / totalVolume)); // Acidic
    } else if (chemical.id === "naoh") {
      const poh = -Math.log10(molarity * (amount / totalVolume));
      ph = 14 - poh; // Basic
    }

    return {
      molarity: molarity * (amount / totalVolume),
      moles,
      ph: Math.max(0, Math.min(14, ph)),
    };
  };

  const handleChemicalSelect = (id: string) => {
    setSelectedChemical(selectedChemical === id ? null : id);
  };

  const handleChemicalDrop = useCallback(
    (chemicalId: string, equipmentId: string, amount: number) => {
      const chemical = experimentChemicals.find((c) => c.id === chemicalId);
      if (!chemical) return;

      // Save current state before making changes
      saveStateToHistory();

      // Enhanced phenolphthalein handling for conical flask (proper placement)
      if (chemicalId === "phenol" && equipmentId === "conical_flask") {
        setToastMessage(
          `✨ Added ${amount}mL of Phenolphthalein indicator to conical flask`,
        );
        setTimeout(() => setToastMessage(null), 3000);

        // Step 3: Add Indicator - Phenolphthalein added to conical flask
        markStepCompleted(3, "Phenolphthalein indicator added");

        // Add phenolphthalein to conical flask - this is the correct usage for titration
        setEquipmentPositions((prev) =>
          prev.map((pos) => {
            if (pos.id === equipmentId) {
              const newChemicals = [
                ...pos.chemicals,
                {
                  id: chemicalId,
                  name: chemical.name,
                  color: chemical.color,
                  amount,
                  concentration: chemical.concentration,
                },
              ];
              return { ...pos, chemicals: newChemicals };
            }
            return pos;
          }),
        );
        return;
      }

      // Enhanced NaOH handling for burette (proper placement)
      if (chemicalId === "naoh" && equipmentId === "burette") {
        setToastMessage(`🧪 Filled burette with ${amount}mL of NaOH solution`);
        setTimeout(() => setToastMessage(null), 3000);

        // Step 1: Prepare Equipment - NaOH added to burette completes equipment preparation
        markStepCompleted(1, "NaOH added to burette - equipment ready");

        // Add NaOH to burette - this is the correct setup for acid-base titration
        setEquipmentPositions((prev) =>
          prev.map((pos) => {
            if (pos.id === equipmentId) {
              const newChemicals = [
                ...pos.chemicals,
                {
                  id: chemicalId,
                  name: chemical.name,
                  color: chemical.color,
                  amount,
                  concentration: chemical.concentration,
                },
              ];
              return { ...pos, chemicals: newChemicals };
            }
            return pos;
          }),
        );
        return;
      }

      // Legacy phenolphthalein to burette support (though not typical)
      if (chemicalId === "phenol" && equipmentId === "burette") {
        setToastMessage(`Added ${amount}mL of ${chemical.name} to burette`);
        setTimeout(() => setToastMessage(null), 3000);

        // Add chemical to burette normally
        setEquipmentPositions((prev) =>
          prev.map((pos) => {
            if (pos.id === equipmentId) {
              const newChemicals = [
                ...pos.chemicals,
                {
                  id: chemicalId,
                  name: chemical.name,
                  color: chemical.color,
                  amount,
                  concentration: chemical.concentration,
                },
              ];
              return { ...pos, chemicals: newChemicals };
            }
            return pos;
          }),
        );
        return;
      }

      setEquipmentPositions((prev) =>
        prev.map((pos) => {
          if (pos.id === equipmentId) {
            const newChemicals = [
              ...pos.chemicals,
              {
                id: chemicalId,
                name: chemical.name,
                color: chemical.color,
                amount,
                concentration: chemical.concentration,
              },
            ];

            // Show success toast
            setToastMessage(
              `Added ${amount}mL of ${chemical.name} to ${equipmentId}`,
            );
            setTimeout(() => setToastMessage(null), 3000);

            // Check for Acid-Base Titration step completion
            if (experimentTitle.includes("Acid-Base")) {
              if (chemicalId === "hcl" && equipmentId === "conical_flask") {
                markStepCompleted(2, "HCl sample prepared in conical flask");
              }
            }

            // Check if this completes a guided step for Aspirin Synthesis
            if (experimentTitle.includes("Aspirin")) {
              const currentStep = aspirinGuidedSteps[currentGuidedStep - 1];
              if (
                currentStep?.requiredChemical === chemicalId &&
                currentStep?.targetEquipment === equipmentId
              ) {
                setCurrentGuidedStep((prev) => prev + 1);
                setToastMessage(`✓ Step ${currentGuidedStep} completed!`);
                setTimeout(() => setToastMessage(null), 3000);
              }
            }

            // Calculate reaction if chemicals are mixed
            if (newChemicals.length >= 2) {
              const totalVolume = newChemicals.reduce(
                (sum, c) => sum + c.amount,
                0,
              );
              handleReaction(newChemicals, totalVolume, equipmentId);

              // Update measurements for experiments 2 and 3
              if (
                experimentTitle.includes("Acid-Base") ||
                experimentTitle.includes("Equilibrium")
              ) {
                // Use the most recent chemical for calculations
                const recentChemical = newChemicals[newChemicals.length - 1];
                const calculations = calculateChemicalProperties(
                  recentChemical,
                  recentChemical.amount,
                  totalVolume,
                );
                setMeasurements((prev) => ({
                  ...prev,
                  volume: totalVolume,
                  concentration: calculations.molarity,
                  ph: calculations.ph,
                  molarity: calculations.molarity,
                  moles: calculations.moles,
                }));
              }
            }

            return { ...pos, chemicals: newChemicals };
          }
          return pos;
        }),
      );

      setSelectedChemical(null);
    },
    [
      experimentChemicals,
      saveStateToHistory,
      markStepCompleted,
      experimentTitle,
      currentGuidedStep,
      aspirinGuidedSteps,
    ],
  );

  const handleReaction = (
    chemicals: any[],
    totalVolume: number,
    equipmentId?: string,
  ) => {
    // Enhanced reaction detection with equipment specificity
    const hasAcid = chemicals.some((c) => c.id === "hcl");
    const hasBase = chemicals.some((c) => c.id === "naoh");
    const hasIndicator = chemicals.some((c) => c.id === "phenol");

    if (hasAcid && hasBase) {
      // Calculate reaction specifics
      const hclAmount = chemicals.find((c) => c.id === "hcl")?.amount || 0;
      const naohAmount = chemicals.find((c) => c.id === "naoh")?.amount || 0;

      // Calculate limiting reagent (assuming equal molarity)
      const limitingAmount = Math.min(hclAmount, naohAmount);
      const excessReagent =
        hclAmount > naohAmount
          ? "HCl"
          : naohAmount > hclAmount
            ? "NaOH"
            : "none";

      let reactionTitle = "Acid-Indicator Interaction Detected";
      let reactionDescription = "HCl + C₂₀H₁����O��� → Colorless complex";

      // Enhanced messaging for conical flask
      if (equipmentId === "conical_flask") {
        reactionTitle = hasIndicator
          ? "Titration with Indicator in Conical Flask"
          : "Neutralization in Conical Flask";
        reactionDescription = hasIndicator
          ? `${limitingAmount.toFixed(1)}mL titration: HCl + NaOH → NaCl + H₂O (C₂��H₁₄O��� endpoint indicator)`
          : `${limitingAmount.toFixed(1)}mL reaction: HCl + NaOH → NaCl + H₂O`;
      }

      const result: Result = {
        id: Date.now().toString(),
        type: "reaction",
        title: reactionTitle,
        description: reactionDescription,
        timestamp: new Date().toLocaleTimeString(),
        calculation: {
          reaction: hasIndicator
            ? "HCl + NaOH → NaCl + H₂O (with C₂₀H₁₄O₄)"
            : "HCl + NaOH → NaCl + H₂O",
          reactionType: hasIndicator
            ? "Acid-Base Titration with Indicator"
            : "Acid-Base Neutralization",
          balancedEquation: hasIndicator
            ? "HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l) [C₂���H₁₄O₄ endpoint indicator]"
            : "HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)",
          products: hasIndicator
            ? [
                "Sodium Chloride (NaCl)",
                "Water (H₂O)",
                "Color change at endpoint",
              ]
            : ["Sodium Chloride (NaCl)", "Water (H₂O)"],
          yield: 95,
          volumeAdded: limitingAmount,
          totalVolume: totalVolume,
          ph: 7.0,
          molarity: (limitingAmount * 0.1) / (totalVolume / 1000),
          mechanism: [
            "1. HCl dissociates: HCl → H⁺ + Cl⁻",
            "2. NaOH dissociates: NaOH ��� Na⁺ + OH��",
            "3. Neutralization: H⁺ + OH⁻ → H₂O",
            "4. Salt formation: Na⁺ + Cl⁻ ��� NaCl",
          ],
          thermodynamics: {
            deltaH: -57.3,
            deltaG: -79.9,
            equilibriumConstant: 1.0e14,
          },
        },
      };

      setResults((prev) => [...prev, result]);

      // Step 6: Calculate Concentration - Mark when result is calculated for Acid-Base Titration
      if (
        experimentTitle.includes("Acid-Base") &&
        hasAcid &&
        hasBase &&
        !hasCalculatedResult
      ) {
        setHasCalculatedResult(true);
        markStepCompleted(6, "Concentration calculated");
      }

      // Special toast message for conical flask
      if (equipmentId === "conical_flask") {
        setToastMessage(
          `🧪 Acid-indicator reaction complete! HCl + C₂₀H₁₄O₄ → Colorless complex`,
        );
        setTimeout(() => setToastMessage(null), 4000);
      }
    }
  };

  const handleStartExperiment = () => {
    setIsRunning(true);
    if (onTimerStart) {
      onTimerStart();
    }
    // Don't call onStepComplete here - progress should update on individual step completion
  };

  // Titration control functions
  const handleStartTitration = useCallback(() => {
    const burette = equipmentPositions.find((pos) => pos.id === "burette");
    const conicalFlask = equipmentPositions.find(
      (pos) => pos.id === "conical_flask",
    );
    const stirrer = equipmentPositions.find(
      (pos) => pos.id === "magnetic_stirrer",
    );

    if (!burette || !conicalFlask) {
      setToastMessage("⚠️ Please place both burette and conical flask first!");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const hasNaOH = burette.chemicals.some((c) => c.id === "naoh");
    if (!hasNaOH) {
      setToastMessage("⚠��� Please add NaOH to the burette first!");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setIsTitrating(true);

    // Show Results Panel immediately when titration starts
    setShowResultsPanel(true);

    // Step 4: Initial Titration - Start titration button pressed
    markStepCompleted(4, "Initial titration started");

    // Auto-start magnetic stirrer if available
    if (stirrer && !isStirring) {
      setIsStirring(true);
      setStirerActive(true);
      setToastMessage(
        "🧪 Starting titration with automatic stirring - NaOH added to flask!",
      );
    } else {
      setToastMessage("🧪 Starting titration - NaOH added to conical flask!");
    }
    setTimeout(() => setToastMessage(null), 3000);

    // Immediately add NaOH to conical flask when titration starts
    const hasNaOHInFlask = conicalFlask.chemicals.some((c) => c.id === "naoh");

    if (!hasNaOHInFlask) {
      // Automatically add NaOH to conical flask
      setEquipmentPositions((prev) =>
        prev.map((pos) => {
          if (pos.id === "conical_flask") {
            return {
              ...pos,
              chemicals: [
                ...pos.chemicals,
                {
                  id: "naoh",
                  name: "Sodium Hydroxide",
                  color: "transparent",
                  amount: 1.0, // Start with small amount (will increase with titration)
                  concentration: "0.1 M",
                },
              ],
            };
          }
          return pos;
        }),
      );
    }

    // Add initial titration analysis result immediately
    const initialResult: Result = {
      id: `titration_start_${Date.now()}`,
      type: "success",
      title: "Titration Analysis Started",
      description:
        "Real-time analysis of acid-base titration in progress. Monitoring color changes and endpoint detection.",
      timestamp: new Date().toLocaleTimeString(),
      calculation: {
        reaction: "HCl + NaOH → NaCl + H₂O (in progress)",
        reactionType: "Acid-Base Titration - Initial Analysis",
        balancedEquation: "HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)",
        products: [
          "Titration in progress",
          "Monitoring pH changes",
          "Awaiting endpoint",
        ],
        volumeAdded: 5.0, // Initial volume
        totalVolume: 30.0,
        concentration: "~0.1 M (calculating...)",
        molarity: 0.1,
        moles: 0.0005,
        ph: 6.5, // Transitioning pH
        yield: 20, // Initial progress
        mechanism: [
          "1. Initial setup: HCl solution prepared with phenolphthalein",
          "2. NaOH addition started from burette",
          "3. Gradual neutralization occurring",
          "4. pH slowly increasing towards endpoint",
          "5. Monitoring for color change to pink",
        ],
        thermodynamics: {
          deltaH: -57.3,
          deltaG: -79.9,
          equilibriumConstant: 1.0e14,
        },
      },
    };

    setResults((prev) => [...prev, initialResult]);
    setToastMessage("📊 Analysis Panel opened - Monitoring titration progress");
    setTimeout(() => setToastMessage(null), 3000);

    // Start enhanced color transition from lighter pink to darker pink over 8 seconds with volume increase
    setTitrationColorProgress(0);
    const startTime = Date.now();
    const duration = 8000; // 8 seconds for smoother, more dramatic color transition

    const animateColor = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Use enhanced easing function for even smoother transition
      const easedProgress =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2; // cubic ease-in-out function
      const currentColorIntensity = cumulativeColorIntensity + easedProgress;
      setTitrationColorProgress(currentColorIntensity);

      // Continuously increase volume during titration (cumulative across multiple titrations)
      const volumeIncrease = progress * 20.0; // 20mL added per titration cycle
      const currentVolume = cumulativeVolume + volumeIncrease;

      // Update measurements with increasing volume and changing pH
      setMeasurements((prev) => ({
        ...prev,
        volume: currentVolume,
        ph: 6.5 + progress * 2.8, // pH rises from 6.5 to ~9.3
        molarity: 0.1 - progress * 0.05, // Molarity decreases slightly due to dilution
        moles: (currentVolume / 1000) * 0.1, // Calculate moles based on volume
      }));

      // Update the amount of solution in the conical flask
      const currentAmount = 1.0 + progress * 2.0; // Increase solution amount in flask
      setEquipmentPositions((prev) =>
        prev.map((pos) => {
          if (pos.id === "conical_flask") {
            return {
              ...pos,
              chemicals: pos.chemicals.map((chemical) => {
                if (chemical.id === "naoh") {
                  return {
                    ...chemical,
                    amount: currentAmount,
                  };
                }
                return chemical;
              }),
            };
          }
          return pos;
        }),
      );

      // Step 5: Identify Endpoint - Mark when color starts turning pink (30% progress for slower effect)
      if (easedProgress >= 0.3 && !completedSteps.has(5)) {
        markStepCompleted(5, "Endpoint identified - solution turned pink");
        // Note: No longer automatically stopping - allow continued titration for over-titration effect
      }

      // Update cumulative values when titration cycle completes
      if (progress >= 1) {
        setTimeout(() => {
          if (isTitrating) {
            // Update cumulative values for next titration cycle
            setCumulativeVolume(currentVolume);
            setCumulativeColorIntensity(currentColorIntensity);

            setIsTitrating(false);
            setDropwiseAnimation({ active: false, chemicalId: "", drops: [] });

            // Add result for this titration cycle
            const titrationResult: Result = {
              id: Date.now().toString(),
              type: cumulativeColorIntensity > 1 ? "warning" : "success",
              title:
                cumulativeColorIntensity > 1
                  ? "Over-Titration Detected"
                  : "Acid-Base Titration Cycle Complete",
              description:
                cumulativeColorIntensity > 1
                  ? "Solution is over-titrated - Deeper pink color indicates excess base. Press 'Start Titration' to continue adding more NaOH."
                  : "Titration cycle complete - Solution turned pink. Press 'Start Titration' again to continue adding NaOH.",
              timestamp: new Date().toLocaleTimeString(),
              calculation: {
                reaction:
                  "HCl + NaOH �� NaCl + H₂O (with phenolphthalein endpoint)",
                reactionType: "Acid-Base Titration Complete",
                balancedEquation: "HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)",
                products: [
                  "Sodium Chloride (NaCl)",
                  "Water (H₂O)",
                  "Pink endpoint reached",
                ],
                volumeAdded: currentVolume - 5.0, // Volume added from start
                totalVolume: currentVolume,
                concentration: "0.1000 M HCl determined",
                molarity: 0.1,
                moles: 0.0025,
                ph: 8.3, // Slightly basic at endpoint
                yield: 100,
                mechanism: [
                  "1. Initial: HCl (colorless) + phenolphthalein (colorless in acid)",
                  "2. NaOH addition: Gradual neutralization occurs",
                  "3. Near endpoint: pH rises rapidly",
                  "4. Endpoint: Phenolphthalein turns pink (pH > 8.2)",
                  "5. Result: Equivalent moles of acid and base reacted",
                ],
                thermodynamics: {
                  deltaH: -57.3,
                  deltaG: -79.9,
                  equilibriumConstant: 1.0e14,
                },
              },
            };

            setResults((prev) => [...prev, titrationResult]);

            setToastMessage(
              "🎯 Endpoint reached! Results Panel opened automatically.",
            );
            setTimeout(() => setToastMessage(null), 4000);
          }
        }, 1000); // Small delay for visual effect
      }

      if (progress < 1) {
        requestAnimationFrame(animateColor);
      }
    };

    requestAnimationFrame(animateColor);

    // Start dropwise animation
    startDropwiseAnimation(burette, conicalFlask);
  }, [
    equipmentPositions,
    markStepCompleted,
    isTitrating,
    isStirring,
    cumulativeVolume,
    cumulativeColorIntensity,
    completedSteps,
  ]);

  const handleStopTitration = () => {
    setIsTitrating(false);
    setDropwiseAnimation({ active: false, chemicalId: "", drops: [] });

    // Automatically stop stirring when titration stops
    if (isStirring) {
      setIsStirring(false);
      setStirerActive(false);
      setToastMessage("⏸️ Titration stopped - Stirring automatically stopped");
    } else {
      setToastMessage("⏸️ Titration stopped");
    }
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleStartStirring = () => {
    const stirrer = equipmentPositions.find(
      (pos) => pos.id === "magnetic_stirrer",
    );
    const conicalFlask = equipmentPositions.find(
      (pos) => pos.id === "conical_flask",
    );

    if (!stirrer || !conicalFlask) {
      setToastMessage(
        "�����️ Please place both magnetic stirrer and conical flask!",
      );
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setIsStirring(true);
    setStirerActive(true);
    setToastMessage("🌀 Magnetic stirrer activated!");
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleStopStirring = () => {
    setIsStirring(false);
    setStirerActive(false);
    setToastMessage("⏹️ Stirring stopped");
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Dropwise animation system
  const startDropwiseAnimation = (burette: any, conicalFlask: any) => {
    const interval = setInterval(() => {
      if (!isTitrating) {
        clearInterval(interval);
        return;
      }

      const dropId = `drop_${Date.now()}_${Math.random()}`;
      const newDrop = {
        id: dropId,
        x: burette.x, // Start from burette position
        y: burette.y + 50, // Start below burette tip
        color: "transparent", // NaOH color
      };

      setDropwiseAnimation((prev) => ({
        active: true,
        chemicalId: "naoh",
        drops: [...prev.drops, newDrop],
      }));

      // Simulate adding small amount to conical flask
      setTitrationDropCount((prev) => prev + 1);

      // Every 10 drops, add 0.1mL to conical flask
      if (titrationDropCount % 10 === 0) {
        setEquipmentPositions((prev) =>
          prev.map((pos) => {
            if (pos.id === "conical_flask") {
              const existingNaOH = pos.chemicals.find((c) => c.id === "naoh");
              if (existingNaOH) {
                return {
                  ...pos,
                  chemicals: pos.chemicals.map((c) =>
                    c.id === "naoh" ? { ...c, amount: c.amount + 0.1 } : c,
                  ),
                };
              } else {
                return {
                  ...pos,
                  chemicals: [
                    ...pos.chemicals,
                    {
                      id: "naoh",
                      name: "Sodium Hydroxide",
                      color: "transparent",
                      amount: 0.1,
                      concentration: "0.1 M",
                    },
                  ],
                };
              }
            }
            return pos;
          }),
        );
      }

      // Remove drop after animation
      setTimeout(() => {
        setDropwiseAnimation((prev) => ({
          ...prev,
          drops: prev.drops.filter((drop) => drop.id !== dropId),
        }));
      }, 1500);
    }, 800); // Drop every 800ms
  };

  const handleClearResults = () => {
    setResults([]);
  };

  const handleStepClick = (stepId: number) => {
    setCurrentStep(stepId);
  };

  const handleTrialAdded = () => {
    // Mark step 6 as completed when first trial is added to Experiment Results
    if (experimentTitle.includes("Acid-Base")) {
      markStepCompleted(6, "Concentration calculated - first trial added");
    }
  };

  return (
    <div
      className="w-full bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg overflow-hidden flex"
      style={{ minHeight: "75vh" }}
    >
      {/* Step Procedure Side Panel */}
      <div
        className={`transition-all duration-300 ${showSteps ? "w-80" : "w-12"} flex-shrink-0`}
      >
        {showSteps ? (
          <div className="h-full bg-white/95 backdrop-blur-sm border-r border-gray-200 flex flex-col">
            <div className="p-3 border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-between">
              <div className="flex items-center">
                <List className="w-4 h-4 mr-2" />
                <span className="font-semibold text-sm">Procedure</span>
              </div>
              <button
                onClick={() => setShowSteps(false)}
                className="text-white/80 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Guided Instructions for Aspirin Synthesis */}
              {experimentTitle.includes("Aspirin") ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-lg">
                    <h3 className="font-bold text-sm">Step-by-Step Guide</h3>
                    <p className="text-xs opacity-90">
                      Follow instructions to synthesize aspirin
                    </p>
                  </div>

                  {aspirinGuidedSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        currentGuidedStep === step.id
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : currentGuidedStep > step.id
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 bg-gray-50 opacity-60"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            currentGuidedStep === step.id
                              ? "bg-blue-500 text-white"
                              : currentGuidedStep > step.id
                                ? "bg-green-500 text-white"
                                : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          {currentGuidedStep > step.id ? "✓" : step.id}
                        </div>
                        <h4 className="font-semibold text-sm text-gray-900">
                          {step.title}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-700 ml-8">
                        {step.instruction}
                      </p>

                      {currentGuidedStep === step.id && (
                        <div className="mt-2 ml-8 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                          <span className="font-medium text-yellow-800">
                            👆 Current step
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Chemical Formulas Section */}
                  <ChemicalFormulas experimentTitle={experimentTitle} />
                </div>
              ) : (
                <div className="space-y-4">
                  <ExperimentSteps
                    currentStep={currentStep}
                    steps={experimentSteps}
                    onStepClick={handleStepClick}
                  />
                  <ChemicalFormulas experimentTitle={experimentTitle} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full bg-white/95 backdrop-blur-sm border-r border-gray-200 flex flex-col items-center">
            <button
              onClick={() => setShowSteps(true)}
              className="p-3 text-gray-600 hover:text-blue-600 border-b border-gray-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex-1 flex items-center">
              <div className="transform -rotate-90 text-xs font-medium text-gray-500 whitespace-nowrap">
                Procedure
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Lab Content */}
      <div className="flex-1 flex flex-col">
        {/* Equipment Bar - Top Horizontal */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-800 text-sm flex items-center">
              <Atom className="w-4 h-4 mr-2 text-blue-600" />
              {experimentTitle} - Equipment
            </h4>
            <div className="flex items-center space-x-2">
              {experimentTitle.includes("Aspirin") ? (
                <div className="text-xs text-gray-600 mr-3 flex items-center space-x-2">
                  <span>
                    Progress: {currentGuidedStep - 1}/
                    {aspirinGuidedSteps.length}
                  </span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${((currentGuidedStep - 1) / aspirinGuidedSteps.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-600 mr-3">
                  Step {currentStep} of {experimentSteps.length}
                </div>
              )}
              <Controls
                isRunning={isRunning}
                onStart={handleStartExperiment}
                onStop={() => {
                  setIsRunning(false);
                  if (onTimerStop) {
                    onTimerStop();
                  }
                }}
                onReset={() => {
                  // Reset all experiment state to initial values
                  setEquipmentPositions([]);
                  setUndoHistory([]);
                  setResults([]);
                  setIsRunning(false);
                  setCurrentStep(stepNumber);
                  setSelectedChemical(null);
                  setMeasurements({
                    volume: 0,
                    concentration: 0,
                    ph: 7,
                    molarity: 0,
                    moles: 0,
                    temperature: 25,
                  });
                  setToastMessage(null);
                  setCurrentGuidedStep(1);
                  setDropwiseAnimation({
                    active: false,
                    chemicalId: "",
                    drops: [],
                  });

                  // Reset titration-specific state
                  setIsTitrating(false);
                  setIsStirring(false);
                  setStirerActive(false);
                  setTitrationDropCount(0);
                  setTitrationColorProgress(0);
                  setCumulativeVolume(5.0);
                  setCumulativeColorIntensity(0);
                  setCompletedSteps(new Set());
                  setHasCalculatedResult(false);
                  setShowResultsPanel(false);

                  // Reset timer to 0:00
                  if (onTimerReset) {
                    onTimerReset();
                  }

                  // Reset progress to 0%
                  if (onProgressReset) {
                    onProgressReset();
                  }

                  // Show reset confirmation
                  setToastMessage("🔄 Experiment reset successfully!");
                  setTimeout(() => setToastMessage(null), 3000);
                }}
              />

              {/* Undo Button */}
              <button
                onClick={handleUndo}
                disabled={undoHistory.length === 0}
                className={`flex items-center space-x-1 px-3 py-1 ml-4 rounded text-xs font-medium transition-colors ${
                  undoHistory.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-purple-500 hover:bg-purple-600 text-white"
                }`}
                title="Undo last drag & drop action"
              >
                <Undo2 size={14} />
                <span>Undo ({undoHistory.length})</span>
              </button>

              {/* Titration Control Buttons for Acid-Base Experiment */}
              {experimentTitle.includes("Acid-Base") && (
                <div className="flex items-center space-x-2 ml-4 border-l border-gray-300 pl-4">
                  <button
                    onClick={
                      isTitrating ? handleStopTitration : handleStartTitration
                    }
                    className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                      isTitrating
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  >
                    <Droplets size={14} />
                    <span>
                      {isTitrating ? "Stop Titration" : "Start Titration"}
                    </span>
                  </button>

                  <button
                    onClick={
                      isStirring ? handleStopStirring : handleStartStirring
                    }
                    className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                      isStirring
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="currentColor"
                    >
                      <circle
                        cx="7"
                        cy="7"
                        r="5"
                        stroke="currentColor"
                        strokeWidth="1"
                        fill="none"
                      />
                      <path
                        d="M5 7 L9 7"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                      <path
                        d="M7 5 L7 9"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                    </svg>
                    <span>
                      {isStirring ? "Stop Stirring" : "Start Stirring"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-2 overflow-x-auto pb-2">
            {experimentEquipment.map((equipment) => (
              <div key={equipment.id} className="flex-shrink-0">
                <Equipment
                  id={equipment.id}
                  name={equipment.name}
                  icon={equipment.icon}
                  onDrag={handleEquipmentDrop}
                  position={null}
                  chemicals={[]}
                  onChemicalDrop={handleChemicalDrop}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Main Work Area - Expanded */}
        <div className="flex-1 flex flex-col">
          {/* Lab Work Surface */}
          <div className="flex-1 p-6 relative">
            <WorkBench
              onDrop={handleEquipmentDrop}
              selectedChemical={selectedChemical}
              isRunning={isRunning}
              experimentTitle={experimentTitle}
              currentGuidedStep={currentGuidedStep}
              dropwiseAnimation={dropwiseAnimation}
              isTitrating={isTitrating}
              stirringActive={isStirring}
            >
              {equipmentPositions.map((pos) => {
                const equipment = experimentEquipment.find(
                  (eq) => eq.id === pos.id,
                );
                const conicalFlask = equipmentPositions.find(
                  (eq) => eq.id === "conical_flask",
                );
                const hasNaOHInFlask =
                  conicalFlask?.chemicals?.some((c) => c.id === "naoh") ||
                  false;
                return equipment ? (
                  <Equipment
                    key={pos.id}
                    id={pos.id}
                    name={equipment.name}
                    icon={equipment.icon}
                    onDrag={handleEquipmentDrop}
                    position={pos}
                    chemicals={pos.chemicals}
                    onChemicalDrop={handleChemicalDrop}
                    stirrerActive={stirrerActive}
                    hasNaOHInFlask={hasNaOHInFlask}
                    titrationColorProgress={titrationColorProgress}
                  />
                ) : null;
              })}
            </WorkBench>
          </div>

          {/* Results Panel - When present */}
          {results.length > 0 && (
            <div className="border-t border-gray-200 bg-white/90 backdrop-blur-sm">
              <ResultsPanel
                results={results}
                onClear={handleClearResults}
                onTrialAdded={handleTrialAdded}
              />
            </div>
          )}
        </div>

        {/* Reagents Bar - Bottom Horizontal */}
        <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 p-3">
          <h4 className="font-semibold text-gray-800 text-sm flex items-center mb-2">
            <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
            Chemical Reagents
          </h4>
          <div className="flex items-center space-x-3 overflow-x-auto pb-2">
            {experimentChemicals.map((chemical) => (
              <div key={chemical.id} className="flex-shrink-0">
                <Chemical
                  id={chemical.id}
                  name={chemical.name}
                  formula={chemical.formula}
                  color={chemical.color}
                  concentration={chemical.concentration}
                  volume={chemical.volume}
                  onSelect={handleChemicalSelect}
                  selected={selectedChemical === chemical.id}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Calculator and pH Meter Bar - For Experiments 2 & 3 */}
        {(experimentTitle.includes("Acid-Base") ||
          experimentTitle.includes("Equilibrium")) && (
          <div className="bg-gray-900 text-white p-3 border-t border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* pH Meter Section */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">pH Meter</span>
                  </div>
                  <div className="bg-black px-3 py-1 rounded font-mono text-lg">
                    {measurements.ph.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {measurements.ph < 7
                      ? "Acidic"
                      : measurements.ph > 7
                        ? "Basic"
                        : "Neutral"}
                  </div>
                </div>

                {/* Volume Tracker */}
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium">Volume</span>
                  <div className="bg-black px-3 py-1 rounded font-mono text-lg">
                    {measurements.volume.toFixed(1)} mL
                  </div>
                </div>

                {/* Molarity Calculator */}
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium">Molarity</span>
                  <div className="bg-black px-3 py-1 rounded font-mono text-lg">
                    {measurements.molarity.toFixed(3)} M
                  </div>
                </div>
              </div>

              {/* Calculator Actions */}
              <div className="flex items-center space-x-3">
                {experimentTitle.includes("Acid-Base") && (
                  <button
                    onClick={() => {
                      const equivalencePoint = 25.0; // mL for 0.1M solutions
                      const percentComplete =
                        (measurements.volume / equivalencePoint) * 100;
                      console.log(
                        `Titration ${percentComplete.toFixed(1)}% complete`,
                      );
                    }}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Calculate Endpoint
                  </button>
                )}

                {experimentTitle.includes("Equilibrium") && (
                  <button
                    onClick={() => {
                      const kc = Math.pow(10, -measurements.ph); // Simplified equilibrium constant
                      console.log(
                        `Equilibrium constant: ${kc.toExponential(2)}`,
                      );
                    }}
                    className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Calculate Kc
                  </button>
                )}

                <button
                  onClick={() => {
                    // Reset calculations
                    setMeasurements((prev) => ({
                      ...prev,
                      volume: 0,
                      concentration: 0,
                      ph: 7,
                      molarity: 0,
                      moles: 0,
                    }));
                  }}
                  className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Additional calculation info */}
            {measurements.volume > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <div className="flex items-center space-x-4">
                    <span>Moles: {measurements.moles.toFixed(4)} mol</span>
                    {experimentTitle.includes("Acid-Base") && (
                      <span>
                        Endpoint:{" "}
                        {measurements.ph > 8.5 ? "✓ Reached" : "○ Not reached"}
                      </span>
                    )}
                    {experimentTitle.includes("Equilibrium") && (
                      <span>Temperature: {measurements.temperature}°C</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default VirtualLabApp;
