import React from "react";

interface MeasurementsData {
  ph: number;
  volume: number;
  molarity: number;
  temperature: number;
}

interface MeasurementsPanelProps {
  measurements: MeasurementsData;
  onCalculateEndpoint: () => void;
  onReset: () => void;
  isVisible: boolean;
}

export const MeasurementsPanel: React.FC<MeasurementsPanelProps> = ({
  measurements,
  onCalculateEndpoint,
  onReset,
  isVisible,
}) => {
  if (!isVisible) return null;

  const getPhStatus = (ph: number) => {
    if (ph < 6.5) return "Acidic";
    if (ph > 7.5) return "Basic";
    return "Neutral";
  };

  const phStatus = getPhStatus(measurements.ph);

  return (
    <div className="bg-gray-800 rounded-lg px-4 py-3 mb-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* pH Meter */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="text-white text-sm font-medium leading-tight">
                pH
                <br />
                Meter
              </div>
            </div>
            <div className="text-white text-xl font-bold">
              {measurements.ph.toFixed(2)}
            </div>
            <div className="text-gray-300 text-sm">{phStatus}</div>
          </div>

          {/* Volume */}
          <div className="text-center">
            <div className="text-gray-300 text-sm">Volume</div>
            <div className="text-white text-xl font-bold">
              {measurements.volume.toFixed(1)}
            </div>
            <div className="text-gray-400 text-xs">mL</div>
          </div>

          {/* Molarity */}
          <div className="text-center">
            <div className="text-gray-300 text-sm">Molarity</div>
            <div className="text-white text-xl font-bold">
              {measurements.molarity.toFixed(3)}
            </div>
            <div className="text-gray-400 text-xs">M</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onCalculateEndpoint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors leading-tight"
          >
            Calculate
            <br />
            Endpoint
          </button>
          <button
            onClick={onReset}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
