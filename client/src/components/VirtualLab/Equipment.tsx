import React, { useState } from "react";
import {
  Beaker,
  FlaskConical,
  TestTube,
  Droplet,
  Thermometer,
} from "lucide-react";

interface EquipmentProps {
  id: string;
  name: string;
  icon: React.ReactNode;
  onDrag: (id: string, x: number, y: number) => void;
  position: { x: number; y: number } | null;
  chemicals?: Array<{
    id: string;
    name: string;
    color: string;
    amount: number;
    concentration: string;
  }>;
  onChemicalDrop?: (
    chemicalId: string,
    equipmentId: string,
    amount: number,
  ) => void;
  stirrerActive?: boolean;
  hasNaOHInFlask?: boolean;
  titrationColorProgress?: number;
}

export const Equipment: React.FC<EquipmentProps> = ({
  id,
  name,
  icon,
  onDrag,
  position,
  chemicals = [],
  onChemicalDrop,
  stirrerActive = false,
  hasNaOHInFlask = false,
  titrationColorProgress = 0,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDropping, setIsDropping] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("equipment", id);
    e.dataTransfer.effectAllowed = "move";

    // Store current position for smooth transitions
    if (position) {
      e.dataTransfer.setData("currentX", position.x.toString());
      e.dataTransfer.setData("currentY", position.y.toString());
    }

    // Add visual feedback during drag
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = "0.6";
    target.style.transform = isOnWorkbench
      ? "translate(-50%, -50%) scale(0.95)"
      : "scale(0.95)";
    target.style.zIndex = "9999";
    target.style.transition = "all 0.2s ease";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Clean up drag styling
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = "";
    target.style.transform = isOnWorkbench ? "translate(-50%, -50%)" : "";
    target.style.zIndex = isOnWorkbench ? "10" : "";
    target.style.transition = "";
  };

  const handleChemicalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if this is a valid drop combination
    const chemicalData = e.dataTransfer.getData("chemical");
    if (chemicalData) {
      const chemical = JSON.parse(chemicalData);
      const isValidDrop =
        (chemical.id === "phenol" && id === "conical_flask") ||
        (chemical.id === "naoh" && id === "burette") ||
        (isContainer && !["phenol", "naoh"].includes(chemical.id)) ||
        (["phenol", "naoh"].includes(chemical.id) && isContainer);

      if (isValidDrop) {
        setIsDragOver(true);
      }
    } else {
      setIsDragOver(true);
    }
  };

  const handleChemicalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleChemicalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsDropping(true);

    const chemicalData = e.dataTransfer.getData("chemical");
    if (chemicalData && onChemicalDrop) {
      const chemical = JSON.parse(chemicalData);
      onChemicalDrop(chemical.id, id, chemical.volume || 25);

      // Show success feedback
      console.log(
        `Added ${chemical.volume || 25}mL of ${chemical.name} to ${name}`,
      );

      // Reset dropping animation after a delay
      setTimeout(() => setIsDropping(false), 2000);
    }
  };

  const isOnWorkbench = position && (position.x !== 0 || position.y !== 0);
  const isContainer = [
    "beaker",
    "flask",
    "burette",
    "erlenmeyer_flask",
    "conical_flask",
    "test_tubes",
    "beakers",
  ].includes(id);

  // Calculate mixed color from all chemicals
  const getMixedColor = () => {
    if (chemicals.length === 0) return "transparent";
    if (chemicals.length === 1) return chemicals[0].color;

    // Enhanced color mixing for chemical reactions
    const chemicalIds = chemicals.map((c) => c.id).sort();

    // Specific reaction colors with titration color transition
    if (chemicalIds.includes("hcl") && chemicalIds.includes("naoh")) {
      if (chemicalIds.includes("phenol")) {
        // Enhanced color transition: lighter pink to darker pink with smooth animation
        if (titrationColorProgress > 0) {
          if (titrationColorProgress <= 1) {
            // First stage: Very light pink to medium pink
            const startColor = { r: 255, g: 220, b: 230 }; // Very light pink #FFDCE6
            const endColor = { r: 255, g: 182, b: 193 }; // Light pink #FFB6C1

            // Apply smooth easing function for more natural color transition
            const easedProgress =
              titrationColorProgress *
              titrationColorProgress *
              (3 - 2 * titrationColorProgress);

            const r = Math.round(
              startColor.r + (endColor.r - startColor.r) * easedProgress,
            );
            const g = Math.round(
              startColor.g + (endColor.g - startColor.g) * easedProgress,
            );
            const b = Math.round(
              startColor.b + (endColor.b - startColor.b) * easedProgress,
            );

            return `rgb(${r}, ${g}, ${b})`;
          } else {
            // Second stage: Medium pink to deep pink (over-titration)
            const normalizedProgress = Math.min(
              (titrationColorProgress - 1) / 2,
              1,
            ); // Next 2 units for darker transition
            const startColor = { r: 255, g: 182, b: 193 }; // Light pink #FFB6C1
            const endColor = { r: 199, g: 21, b: 133 }; // Deep pink/magenta #C71585

            // Apply smooth easing for the darker transition as well
            const easedProgress =
              normalizedProgress *
              normalizedProgress *
              (3 - 2 * normalizedProgress);

            const r = Math.round(
              startColor.r + (endColor.r - startColor.r) * easedProgress,
            );
            const g = Math.round(
              startColor.g + (endColor.g - startColor.g) * easedProgress,
            );
            const b = Math.round(
              startColor.b + (endColor.b - startColor.b) * easedProgress,
            );

            return `rgb(${r}, ${g}, ${b})`;
          }
        }
        return "#FFB6C1"; // Pink when phenolphthalein is added to basic solution
      }
      return "#E8F5E8"; // Light green for neutralization
    }

    if (chemicalIds.includes("phenol") && chemicalIds.includes("naoh")) {
      return "#FF69B4"; // Bright pink
    }

    // HCl + Phenolphthalein combination (acidic solution)
    if (
      chemicalIds.includes("hcl") &&
      chemicalIds.includes("phenol") &&
      !chemicalIds.includes("naoh")
    ) {
      return "#ADD8E6"; // Light blue for HCl + Phenolphthalein in acidic solution
    }

    // Default color mixing
    let r = 0,
      g = 0,
      b = 0,
      totalAmount = 0;

    chemicals.forEach((chemical) => {
      const color = chemical.color;
      const amount = chemical.amount;

      const hex = color.replace("#", "");
      const rVal = parseInt(hex.substr(0, 2), 16);
      const gVal = parseInt(hex.substr(2, 2), 16);
      const bVal = parseInt(hex.substr(4, 2), 16);

      r += rVal * amount;
      g += gVal * amount;
      b += bVal * amount;
      totalAmount += amount;
    });

    if (totalAmount === 0) return "transparent";

    r = Math.round(r / totalAmount);
    g = Math.round(g / totalAmount);
    b = Math.round(b / totalAmount);

    return `rgb(${r}, ${g}, ${b})`;
  };

  const getSolutionHeight = () => {
    const totalVolume = chemicals.reduce(
      (sum, chemical) => sum + chemical.amount,
      0,
    );
    return Math.min(85, (totalVolume / 100) * 85);
  };

  const getEquipmentSpecificRendering = () => {
    if (id === "conical_flask" && isOnWorkbench) {
      const hasHCl = chemicals.some((c) => c.id === "hcl");
      const hasNaOH = chemicals.some((c) => c.id === "naoh");
      const hasPhenolphthalein = chemicals.some((c) => c.id === "phenol");
      const isNeutralizationReaction = hasHCl && hasNaOH;

      return (
        <div className="relative">
          {/* Real Conical Flask Image - 2.5x larger */}
          <div className="relative w-50 h-60">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F5b489eed84cd44f89c5431dbe9fd14d3%2F18f408c6f29d4176ac4ae731a3650daa?format=webp&width=800"
              alt="Laboratory Conical Flask"
              className="w-full h-full object-contain"
              style={{
                filter:
                  "brightness(1.0) contrast(1.0) drop-shadow(0 8px 16px rgba(0,0,0,0.2))",
                background: "transparent",
              }}
            />

            {/* Solution overlay in flask */}
            {chemicals.length > 0 && (
              <div
                className="absolute bottom-5 left-1/2 transform -translate-x-1/2 transition-all duration-1000 ease-in-out"
                style={{
                  backgroundColor: getMixedColor(),
                  height: `${getSolutionHeight() * 0.7}%`,
                  width: "60%",
                  opacity: 0.85,
                  minHeight: "15px",
                  borderRadius: "0 0 25px 25px",
                  clipPath:
                    "polygon(15% 0%, 85% 0%, 95% 60%, 90% 85%, 85% 95%, 15% 95%, 10% 85%, 5% 60%)",
                  background: `linear-gradient(to bottom, ${getMixedColor()}, ${getMixedColor()}dd)`,
                  filter: `saturate(${1 + (titrationColorProgress || 0) * 0.5}) brightness(${1 + (titrationColorProgress || 0) * 0.2})`,
                  transition:
                    "background-color 1000ms ease-in-out, filter 1000ms ease-in-out",
                }}
              >
                {/* Liquid surface shimmer */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-white opacity-40 animate-pulse"></div>

                {/* Enhanced Phenolphthalein indicator effect with titration animation */}
                {hasPhenolphthalein && hasNaOH && (
                  <div
                    className={`absolute inset-0 rounded-b-lg ${
                      titrationColorProgress > 0 ? "animate-pulse" : ""
                    }`}
                    style={{
                      background:
                        titrationColorProgress > 0
                          ? `radial-gradient(circle at center, ${getMixedColor()}80, transparent 70%)`
                          : "",
                      opacity: 0.6 + (titrationColorProgress || 0) * 0.3,
                      animation:
                        titrationColorProgress > 0
                          ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                          : "none",
                    }}
                  />
                )}

                {/* Special swirling effect during active titration */}
                {titrationColorProgress > 0 && titrationColorProgress < 1 && (
                  <div className="absolute inset-0 rounded-b-lg overflow-hidden">
                    <div
                      className="absolute inset-0 animate-spin"
                      style={{
                        background: `conic-gradient(from 0deg, transparent, ${getMixedColor()}40, transparent, ${getMixedColor()}20, transparent)`,
                        animation: "spin 4s linear infinite",
                        opacity: 0.3,
                      }}
                    />
                  </div>
                )}

                {/* Enhanced bubbling animation for reactions and stirring */}
                {(isNeutralizationReaction || stirrerActive) && (
                  <div className="absolute inset-0">
                    {[...Array(stirrerActive ? 10 : 6)].map((_, i) => (
                      <div
                        key={i}
                        className={`absolute w-1 h-1 bg-white opacity-80 rounded-full ${
                          stirrerActive ? "animate-pulse" : "animate-bounce"
                        }`}
                        style={{
                          left: `${15 + i * 8}%`,
                          bottom: `${8 + (i % 4) * 8}px`,
                          animationDelay: `${i * (stirrerActive ? 0.1 : 0.2)}s`,
                          animationDuration: stirrerActive ? "0.8s" : "1.5s",
                        }}
                      ></div>
                    ))}

                    {/* Vortex effect when stirring */}
                    {stirrerActive && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white opacity-30 rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Volume markings overlay */}
            <div className="absolute right-0 top-6 text-xs text-gray-700 font-bold">
              <div className="mb-1">250</div>
              <div className="mb-1">150</div>
              <div className="mb-1">50</div>
            </div>
          </div>

          {/* Drop success animation - removed blinking */}
          {isDropping && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                ✓ Added!
              </div>
            </div>
          )}
        </div>
      );
    }

    if (id === "burette" && isOnWorkbench) {
      const hasNaOH = chemicals.some((c) => c.id === "naoh");
      const naohAmount = chemicals.find((c) => c.id === "naoh")?.amount || 0;

      return (
        <div className="relative flex items-center justify-center">
          {/* Real Burette Image - Better aligned */}
          <div className="relative w-32 h-72 flex items-center justify-center">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F5b489eed84cd44f89c5431dbe9fd14d3%2F2ad8cf1ef1394deabc2721f0caee85ef?format=webp&width=800"
              alt="Laboratory Burette"
              className="w-full h-full object-contain object-center"
              style={{
                filter:
                  "brightness(1.0) contrast(1.0) drop-shadow(0 8px 16px rgba(0,0,0,0.2))",
                background: "transparent",
              }}
            />

            {/* Solution overlay in burette - fills from 50mL to 30mL mark */}
            {chemicals.length > 0 && (
              <div
                className="absolute top-12 left-1/2 transform -translate-x-1/2 transition-all duration-500"
                style={{
                  backgroundColor: getMixedColor(),
                  height: "96px",
                  width: "18px",
                  opacity: 0.9,
                  borderRadius: "2px 2px 0 0",
                  clipPath: "polygon(20% 0%, 80% 0%, 85% 100%, 15% 100%)",
                }}
              >
                {/* Liquid surface shimmer at 30mL mark */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white opacity-40 animate-pulse"></div>
              </div>
            )}

            {/* Volume markings overlay - better positioned */}
            <div className="absolute -left-6 top-12 text-xs text-gray-700 font-bold">
              <div className="mb-6">50</div>
              <div className="mb-6">40</div>
              <div className="mb-6">30</div>
              <div className="mb-6">20</div>
              <div className="mb-6">10</div>
            </div>
          </div>

          {/* Drop animation when chemicals are added */}
          {isDropping && (
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
              <div
                className="w-1 h-1 rounded-full animate-bounce"
                style={{ backgroundColor: getMixedColor() }}
              ></div>
            </div>
          )}
        </div>
      );
    }

    if (id === "erlenmeyer_flask" && isOnWorkbench) {
      return (
        <div className="relative">
          {/* Enhanced Erlenmeyer Flask Illustration */}
          <svg
            width="80"
            height="100"
            viewBox="0 0 80 100"
            className="drop-shadow-lg"
          >
            {/* Flask body */}
            <path
              d="M25 20 L25 35 L10 70 L70 70 L55 35 L55 20 Z"
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#2563eb"
              strokeWidth="2"
            />
            {/* Flask neck */}
            <rect
              x="30"
              y="10"
              width="20"
              height="15"
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#2563eb"
              strokeWidth="2"
              rx="2"
            />
            {/* Flask opening */}
            <ellipse
              cx="40"
              cy="10"
              rx="10"
              ry="2"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
            />

            {/* Solution in flask */}
            {chemicals.length > 0 && (
              <path
                d={`M${15 + chemicals.length * 2} ${70 - getSolutionHeight() * 0.4} L${65 - chemicals.length * 2} ${70 - getSolutionHeight() * 0.4} L70 70 L10 70 Z`}
                fill={getMixedColor()}
                opacity="0.8"
                className="transition-all duration-500"
              />
            )}

            {/* Volume markings */}
            <g stroke="#6b7280" strokeWidth="1" fill="#6b7280">
              <line x1="72" y1="50" x2="75" y2="50" />
              <text x="78" y="53" fontSize="6">
                100mL
              </text>
              <line x1="72" y1="60" x2="75" y2="60" />
              <text x="78" y="63" fontSize="6">
                50mL
              </text>
            </g>

            {/* Bubbling animation for reactions */}
            {chemicals.length > 1 && (
              <g>
                {[...Array(6)].map((_, i) => (
                  <circle
                    key={i}
                    cx={25 + i * 8}
                    cy={65 - (i % 2) * 5}
                    r="1.5"
                    fill="rgba(255, 255, 255, 0.7)"
                    className="animate-bounce"
                    style={{
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: "1.5s",
                    }}
                  />
                ))}
              </g>
            )}

            {/* Flask label */}
            <text
              x="40"
              y="85"
              textAnchor="middle"
              fontSize="8"
              fill="#374151"
              fontWeight="bold"
            >
              125mL Erlenmeyer
            </text>
          </svg>

          {/* Chemical composition display */}
          {chemicals.length > 0 && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded px-2 py-1 text-xs shadow-lg">
              <div className="text-gray-800 font-medium text-center">
                {chemicals.map((c) => c.name.split(" ")[0]).join(" + ")}
              </div>
              <div className="text-gray-600 text-center">
                {chemicals.reduce((sum, c) => sum + c.amount, 0).toFixed(1)} mL
                total
              </div>
            </div>
          )}

          {/* Drop success animation */}
          {isDropping && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium animate-pulse">
                ✓ Added!
              </div>
            </div>
          )}
        </div>
      );
    }

    if (id === "magnetic_stirrer" && isOnWorkbench) {
      return (
        <div className="relative">
          {/* Magnetic Stirrer Visualization - 2.5x larger */}
          <div className="relative w-60 h-40">
            <svg
              width="240"
              height="160"
              viewBox="0 0 96 64"
              className="drop-shadow-lg"
            >
              {/* Stirrer base */}
              <rect
                x="8"
                y="32"
                width="80"
                height="24"
                rx="4"
                stroke="#6b7280"
                strokeWidth="2"
                fill="rgba(107, 114, 128, 0.2)"
              />

              {/* Control panel */}
              <rect
                x="12"
                y="36"
                width="20"
                height="16"
                rx="2"
                fill="#374151"
              />

              {/* Speed control knob */}
              <circle
                cx="22"
                cy="44"
                r="6"
                stroke="#6b7280"
                strokeWidth="1"
                fill="#9ca3af"
              />
              <circle cx="22" cy="44" r="3" fill="#374151" />

              {/* Power indicator - removed blinking */}
              <circle
                cx="70"
                cy="40"
                r="2"
                fill={stirrerActive ? "#10b981" : "#ef4444"}
              />

              {/* Stirrer top surface */}
              <rect
                x="16"
                y="20"
                width="64"
                height="16"
                rx="2"
                stroke="#6b7280"
                strokeWidth="1"
                fill="rgba(229, 231, 235, 0.8)"
              />

              {/* Stirring bar (only visible when stirring) */}
              {stirrerActive && (
                <rect
                  x="44"
                  y="26"
                  width="8"
                  height="2"
                  rx="1"
                  fill="#ef4444"
                  className="animate-spin"
                  style={{
                    transformOrigin: "48px 27px",
                    animationDuration: "0.5s",
                  }}
                />
              )}

              {/* Brand label */}
              <text
                x="48"
                y="52"
                textAnchor="middle"
                fontSize="8"
                fill="#374151"
                fontWeight="bold"
              >
                MAGNETIC STIRRER
              </text>
            </svg>

            {/* Status indicator - removed blinking */}
            {stirrerActive && (
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                Stirring Active
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        {icon}

        {/* Solution visualization for other containers */}
        {isContainer &&
          chemicals.length > 0 &&
          isOnWorkbench &&
          id !== "erlenmeyer_flask" && (
            <div className="absolute inset-0 flex items-end justify-center">
              <div
                className="rounded-b-lg transition-all duration-1000 ease-in-out opacity-80"
                style={{
                  backgroundColor: getMixedColor(),
                  height: `${getSolutionHeight()}%`,
                  width: id === "beaker" ? "70%" : "60%",
                  minHeight: "8px",
                  filter: `saturate(${1 + (titrationColorProgress || 0) * 0.5}) brightness(${1 + (titrationColorProgress || 0) * 0.2})`,
                  transition:
                    "background-color 1000ms ease-in-out, height 500ms ease-in-out, filter 1000ms ease-in-out",
                }}
              >
                {/* Enhanced liquid effects */}
                <div className="relative w-full h-full overflow-hidden rounded-b-lg">
                  {/* Surface shimmer */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-white opacity-40 animate-pulse"></div>

                  {/* Bubbling animation for reactions */}
                  {chemicals.length > 1 && (
                    <div className="absolute inset-0">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1 h-1 bg-white opacity-70 rounded-full animate-bounce"
                          style={{
                            left: `${15 + i * 20}%`,
                            bottom: `${5 + (i % 2) * 15}px`,
                            animationDelay: `${i * 0.3}s`,
                            animationDuration: "1.5s",
                          }}
                        ></div>
                      ))}
                    </div>
                  )}

                  {/* Color change animation */}
                  {chemicals.some((c) => c.id === "phenol") &&
                    chemicals.some((c) => c.id === "naoh") && (
                      <div className="absolute inset-0 bg-pink-300 opacity-50 animate-pulse rounded-b-lg"></div>
                    )}
                </div>
              </div>
            </div>
          )}
      </div>
    );
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={isContainer ? handleChemicalDragOver : undefined}
      onDragLeave={isContainer ? handleChemicalDragLeave : undefined}
      onDrop={isContainer ? handleChemicalDrop : undefined}
      className={`transition-all duration-200 cursor-grab active:cursor-grabbing relative ${
        isOnWorkbench
          ? "bg-transparent border-0 p-0"
          : "flex flex-col items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg border-2 border-gray-200 hover:border-blue-400"
      } ${isContainer && isDragOver && !isOnWorkbench ? "border-green-500 bg-green-50 scale-105" : ""} ${
        isDropping ? "animate-pulse" : ""
      }`}
      style={{
        position: isOnWorkbench ? "absolute" : "relative",
        left: isOnWorkbench && position ? position.x : "auto",
        top: isOnWorkbench && position ? position.y : "auto",
        zIndex: isOnWorkbench ? 10 : "auto",
        transform: isOnWorkbench ? "translate(-50%, -50%)" : "none",
        transition: isOnWorkbench ? "left 0.3s ease, top 0.3s ease" : "none",
      }}
    >
      {/* Subtle drop zone indicator for chemicals */}
      {isContainer && isOnWorkbench && isDragOver && (
        <div className="absolute top-0 left-0 w-2 h-2 rounded-full bg-green-400 animate-pulse opacity-75"></div>
      )}

      {/* Drop hint text */}
      {isContainer && isOnWorkbench && isDragOver && (
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-medium animate-bounce whitespace-nowrap shadow-lg">
          Drop chemical here!
        </div>
      )}

      {/* Drag over animation - only for equipment selection bar */}
      {isDragOver && !isOnWorkbench && (
        <div className="absolute inset-0 border-4 border-green-400 rounded-lg animate-pulse bg-green-100 opacity-50"></div>
      )}

      <div
        className={`transition-all duration-200 relative ${
          isOnWorkbench ? "text-blue-700" : "text-blue-600 mb-3"
        } ${isDragOver ? "scale-110" : ""}`}
      >
        {getEquipmentSpecificRendering()}
      </div>

      {/* Only show equipment name when not on workbench or when dragging over */}
      {(!isOnWorkbench || isDragOver) && (
        <span
          className={`text-sm font-semibold text-center transition-colors ${
            isOnWorkbench ? "text-gray-800" : "text-gray-700"
          } ${isDragOver ? "text-green-700" : ""}`}
        >
          {name}
        </span>
      )}

      {/* Enhanced chemical composition display - only show when actively adding chemicals */}
      {chemicals.length > 0 && isOnWorkbench && isDropping && (
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-black/80 text-white rounded px-2 py-1 text-xs min-w-max opacity-90">
          <div className="text-gray-800 font-medium">
            {chemicals
              .map((chemical) => chemical.name.split(" ")[0])
              .join(" + ")}
          </div>

          {/* Enhanced formula display for conical flask with NaOH + HCl reaction */}
          {id === "conical_flask" && (
            <>
              {/* Show individual chemical formulas */}
              <div className="text-blue-600 font-semibold text-center mt-1">
                {chemicals
                  .map((c) => {
                    if (c.id === "hcl") return "HCl";
                    if (c.id === "naoh") return "NaOH";
                    if (c.id === "phenol") return "C₂���H₁₄O₄";
                    return "";
                  })
                  .filter(Boolean)
                  .join(" + ")}
              </div>

              {/* Show complete reaction equation when both NaOH and HCl are present */}
              {chemicals.some((c) => c.id === "hcl") &&
                chemicals.some((c) => c.id === "naoh") && (
                  <div className="bg-green-50 border border-green-200 rounded px-2 py-1 mt-2">
                    <div className="text-blue-800 font-bold text-center text-xs">
                      Acid-Indicator Reaction
                    </div>
                    <div className="text-blue-700 font-semibold text-center mt-1">
                      HCl + C₂₀H₁₄O₄ → Complex (colorless)
                    </div>
                    <div className="text-blue-600 text-center text-xs mt-1">
                      Acid solution with pH indicator remains colorless
                    </div>
                  </div>
                )}

              {/* Show individual chemical when only one is present */}
              {chemicals.length === 1 &&
                chemicals.some((c) => c.id === "hcl") && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded px-2 py-1 mt-2">
                    <div className="text-yellow-800 font-bold text-center text-xs">
                      Strong Acid
                    </div>
                    <div className="text-yellow-700 text-center text-xs">
                      Hydrochloric acid - pH &lt; 7
                    </div>
                  </div>
                )}

              {chemicals.length === 1 &&
                chemicals.some((c) => c.id === "naoh") && (
                  <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1 mt-2">
                    <div className="text-blue-800 font-bold text-center text-xs">
                      Strong Base
                    </div>
                    <div className="text-blue-700 text-center text-xs">
                      Sodium hydroxide - pH &gt; 7
                    </div>
                  </div>
                )}
            </>
          )}

          <div className="text-gray-600 text-center mt-1">
            {chemicals
              .reduce((sum, chemical) => sum + chemical.amount, 0)
              .toFixed(1)}{" "}
            mL
          </div>
          {/* Color indicator */}
          <div
            className="w-full h-1 rounded-full mt-1"
            style={{ backgroundColor: getMixedColor() }}
          ></div>
        </div>
      )}
    </div>
  );
};

export const equipmentList = [
  { id: "beaker", name: "Beaker", icon: <Beaker size={36} /> },
  { id: "flask", name: "Erlenmeyer Flask", icon: <FlaskConical size={36} /> },
  {
    id: "burette",
    name: "Burette",
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        className="text-blue-600"
      >
        {/* Burette body - narrow vertical tube */}
        <rect
          x="16"
          y="4"
          width="4"
          height="24"
          rx="1"
          stroke="currentColor"
          strokeWidth="2"
          fill="rgba(59, 130, 246, 0.1)"
        />
        {/* Burette top opening */}
        <rect
          x="14"
          y="3"
          width="8"
          height="3"
          rx="1"
          stroke="currentColor"
          strokeWidth="1"
          fill="rgba(59, 130, 246, 0.2)"
        />
        {/* Volume markings */}
        <g stroke="currentColor" strokeWidth="1">
          <line x1="12" y1="8" x2="14" y2="8" />
          <line x1="12" y1="12" x2="14" y2="12" />
          <line x1="12" y1="16" x2="14" y2="16" />
          <line x1="12" y1="20" x2="14" y2="20" />
          <line x1="12" y1="24" x2="14" y2="24" />
        </g>
        {/* Burette stopcock/tap */}
        <rect
          x="15"
          y="28"
          width="6"
          height="3"
          rx="1"
          stroke="currentColor"
          strokeWidth="1"
          fill="rgba(107, 114, 128, 0.8)"
        />
        {/* Burette tip */}
        <path
          d="M17 31 L18 33 L19 31 Z"
          stroke="currentColor"
          strokeWidth="1"
          fill="rgba(59, 130, 246, 0.3)"
        />
      </svg>
    ),
  },
  { id: "thermometer", name: "Thermometer", icon: <Thermometer size={36} /> },
];
