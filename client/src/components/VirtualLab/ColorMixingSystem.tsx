import React from "react";

interface Chemical {
  id: string;
  name: string;
  formula: string;
  color: string;
  amount: number;
}

interface ColorMixingSystemProps {
  chemicals: Chemical[];
  onReactionDetected: (reaction: string) => void;
}

const ColorMixingSystem: React.FC<ColorMixingSystemProps> = ({
  chemicals,
  onReactionDetected,
}) => {
  // Chemical reaction rules
  const reactions = {
    "hcl+phenol": {
      name: "Acid-Indicator Interaction",
      color: "#ADD8E6",
      description: "HCl + C₂₀H₁₄O₄ → Colorless complex",
      indicator: "Indicator remains colorless in acidic solution",
    },
    "agno3+hcl": {
      name: "Silver Chloride Precipitation",
      color: "#F5F5F5",
      description: "AgNO₃ + HCl → AgCl↓ + HNO₃",
      indicator: "White precipitate forms",
    },
    "cacl2+naoh": {
      name: "Calcium Hydroxide Formation",
      color: "#F0F8FF",
      description: "CaCl₂ + 2NaOH → Ca(OH)₂ + 2NaCl",
      indicator: "Milky white solution",
    },
    "phenol+naoh": {
      name: "Indicator Color Change",
      color: "#FFB6C1",
      description: "C₂₀H₁₄O₄ turns pink in basic solution",
      indicator: "Pink color indicates basic pH",
    },
    "hcl+naoh+phenol": {
      name: "Acid-Base Titration with Indicator",
      color: "#FFB6C1",
      description:
        "HCl + NaOH → NaCl + H₂O (with C₂₀H₁₄O₄ indicator showing endpoint)",
      indicator: "Color changes from colorless to pink at endpoint",
    },
    "bromothymol+hcl": {
      name: "pH Indicator Change",
      color: "#87CEEB",
      description: "Bromothymol blue turns light blue in acidic solution",
      indicator: "Light blue color indicates acidic pH",
    },
  };

  const detectReaction = (chemicalIds: string[]): string | null => {
    const sortedIds = chemicalIds.sort().join("+");
    return reactions[sortedIds as keyof typeof reactions]?.color || null;
  };

  const getReactionInfo = (chemicalIds: string[]) => {
    const sortedIds = chemicalIds.sort().join("+");
    return reactions[sortedIds as keyof typeof reactions] || null;
  };

  // Advanced color mixing algorithm
  const mixColors = (chemicals: Chemical[]): string => {
    if (chemicals.length === 0) return "transparent";
    if (chemicals.length === 1) return chemicals[0].color;

    // Check for specific reactions first
    const chemicalIds = chemicals.map((c) => c.id);
    const reactionColor = detectReaction(chemicalIds);
    if (reactionColor) {
      const reaction = getReactionInfo(chemicalIds);
      if (reaction) {
        onReactionDetected(reaction.description);
      }
      return reactionColor;
    }

    // Default color mixing for non-reactive combinations
    let r = 0,
      g = 0,
      b = 0,
      totalWeight = 0;

    chemicals.forEach((chemical) => {
      const weight = chemical.amount;
      const color = chemical.color;

      // Convert hex to RGB
      const hex = color.replace("#", "");
      const rVal = parseInt(hex.substr(0, 2), 16);
      const gVal = parseInt(hex.substr(2, 2), 16);
      const bVal = parseInt(hex.substr(4, 2), 16);

      r += rVal * weight;
      g += gVal * weight;
      b += bVal * weight;
      totalWeight += weight;
    });

    if (totalWeight === 0) return "transparent";

    r = Math.round(r / totalWeight);
    g = Math.round(g / totalWeight);
    b = Math.round(b / totalWeight);

    return `rgb(${r}, ${g}, ${b})`;
  };

  return null; // This is a utility component
};

export { ColorMixingSystem };
