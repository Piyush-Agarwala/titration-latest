import React from "react";
import { FlaskConical, ArrowRight, TestTube } from "lucide-react";

interface ChemicalFormula {
  name: string;
  formula: string;
  type: "reactant" | "product" | "catalyst" | "solvent";
  molWeight?: number;
  phase?: string;
}

interface ChemicalReaction {
  equation: string;
  name: string;
  type: string;
  conditions?: string[];
}

interface ChemicalFormulasProps {
  experimentTitle: string;
}

export const ChemicalFormulas: React.FC<ChemicalFormulasProps> = ({
  experimentTitle,
}) => {
  const getChemicalData = () => {
    if (experimentTitle.includes("Aspirin")) {
      return {
        compounds: [
          {
            name: "Salicylic Acid",
            formula: "C₇H₆O₃",
            type: "reactant" as const,
            molWeight: 138.12,
            phase: "(s)",
          },
          {
            name: "Acetic Anhydride",
            formula: "(CH₃CO)₂O",
            type: "reactant" as const,
            molWeight: 102.09,
            phase: "(l)",
          },
          {
            name: "Acetylsalicylic Acid (Aspirin)",
            formula: "C₉H₈O₄",
            type: "product" as const,
            molWeight: 180.16,
            phase: "(s)",
          },
          {
            name: "Acetic Acid",
            formula: "CH₃COOH",
            type: "product" as const,
            molWeight: 60.05,
            phase: "(l)",
          },
          {
            name: "Phosphoric Acid",
            formula: "H₃PO₄",
            type: "catalyst" as const,
            molWeight: 97.99,
            phase: "(l)",
          },
        ],
        reactions: [
          {
            equation: "C₇H₆O₃ + (CH₃CO)₂O → C₉H₈O₄ + CH₃COOH",
            name: "Esterification Reaction",
            type: "Nucleophilic Acyl Substitution",
            conditions: [
              "H₃PO₄ catalyst",
              "Heat (85°C)",
              "Anhydrous conditions",
            ],
          },
        ],
      };
    } else if (experimentTitle.includes("Acid-Base")) {
      return {
        compounds: [
          {
            name: "Hydrochloric Acid",
            formula: "HCl",
            type: "reactant" as const,
            molWeight: 36.46,
            phase: "(aq)",
          },
          {
            name: "Sodium Hydroxide",
            formula: "NaOH",
            type: "reactant" as const,
            molWeight: 39.997,
            phase: "(aq)",
          },
          {
            name: "Phenolphthalein",
            formula: "C₂₀H₁₄O₄",
            type: "catalyst" as const,
            molWeight: 318.32,
            phase: "(aq)",
          },
        ],
        reactions: [
          {
            equation: "HCl(aq) + C₂₀H₁₄O₄ → HCl-C₂₀H₁₄O₄ complex (colorless)",
            name: "Acid-Indicator Interaction",
            type: "Indicator Reaction",
            conditions: [
              "Room temperature",
              "Aqueous solution",
              "1:1 stoichiometry",
            ],
          },
        ],
      };
    } else if (experimentTitle.includes("Equilibrium")) {
      return {
        compounds: [
          {
            name: "Cobalt(II) Chloride Hexahydrate",
            formula: "CoCl₂·6H₂O",
            type: "reactant" as const,
            molWeight: 237.93,
            phase: "(s)",
          },
          {
            name: "Cobalt(II) Chloride Tetrahydrate",
            formula: "[Co(H₂O)₄]²⁺",
            type: "product" as const,
            molWeight: 201.93,
            phase: "(aq)",
          },
          {
            name: "Tetrachlorocobaltate(II) Ion",
            formula: "[CoCl₄]²⁻",
            type: "product" as const,
            molWeight: 165.87,
            phase: "(aq)",
          },
          {
            name: "Hydrochloric Acid",
            formula: "HCl",
            type: "reactant" as const,
            molWeight: 36.46,
            phase: "(aq)",
          },
          {
            name: "Water",
            formula: "H₂O",
            type: "solvent" as const,
            molWeight: 18.02,
            phase: "(l)",
          },
        ],
        reactions: [
          {
            equation: "[Co(H₂O)₆]²⁺ + 4Cl⁻ ⇌ [CoCl₄]²⁻ + 6H₂O",
            name: "Cobalt Complex Equilibrium",
            type: "Ligand Exchange Equilibrium",
            conditions: [
              "Temperature dependent",
              "Concentration dependent",
              "Le Chatelier's Principle",
            ],
          },
        ],
      };
    }

    return { compounds: [], reactions: [] };
  };

  const { compounds, reactions } = getChemicalData();

  const getTypeColor = (type: string) => {
    switch (type) {
      case "reactant":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "product":
        return "bg-green-100 text-green-800 border-green-200";
      case "catalyst":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "solvent":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "reactant":
        return <FlaskConical className="w-3 h-3" />;
      case "product":
        return <TestTube className="w-3 h-3" />;
      case "catalyst":
        return <span className="text-xs font-bold">⚡</span>;
      case "solvent":
        return <span className="text-xs">💧</span>;
      default:
        return <FlaskConical className="w-3 h-3" />;
    }
  };

  if (compounds.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg border">
      <div className="p-4 border-b bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-t-lg">
        <h2 className="font-semibold">Chemical Formulas</h2>
        <p className="text-sm opacity-90">{experimentTitle}</p>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {/* Chemical Compounds */}
        <div className="space-y-3 mb-6">
          <h3 className="font-medium text-gray-900 text-sm flex items-center">
            <FlaskConical className="w-4 h-4 mr-2 text-green-600" />
            Chemical Compounds
          </h3>
          <div className="grid gap-2">
            {compounds.map((compound, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">
                        {compound.name}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs border ${getTypeColor(compound.type)} flex items-center space-x-1`}
                      >
                        {getTypeIcon(compound.type)}
                        <span className="capitalize">{compound.type}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span className="font-mono bg-white px-2 py-1 rounded border">
                        {compound.formula}
                        {compound.phase && (
                          <span className="text-gray-500">
                            {" "}
                            {compound.phase}
                          </span>
                        )}
                      </span>
                      {compound.molWeight && (
                        <span>MW: {compound.molWeight} g/mol</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chemical Reactions */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 text-sm flex items-center">
            <ArrowRight className="w-4 h-4 mr-2 text-green-600" />
            Chemical Reactions
          </h3>
          <div className="space-y-3">
            {reactions.map((reaction, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border-2 border-green-200 bg-green-50"
              >
                <div className="mb-2">
                  <h4 className="font-medium text-gray-900 text-sm mb-1">
                    {reaction.name}
                  </h4>
                  <div className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded inline-block">
                    {reaction.type}
                  </div>
                </div>

                <div className="font-mono text-sm bg-white p-3 rounded border border-green-300 mb-3 text-center">
                  {reaction.equation}
                </div>

                {reaction.conditions && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1 font-medium">
                      Reaction Conditions:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {reaction.conditions.map((condition, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                          <span>{condition}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
