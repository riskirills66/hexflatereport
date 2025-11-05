import React from 'react';
import { Spinner } from './index';

const SpinnerTest: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold">Spinner Component Test</h2>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Different Sizes</h3>
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-center space-y-2">
            <Spinner size="sm" />
            <span className="text-sm">Small</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Spinner size="md" />
            <span className="text-sm">Medium</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Spinner size="lg" />
            <span className="text-sm">Large</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Spinner size="xl" />
            <span className="text-sm">Extra Large</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Different Colors</h3>
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-center space-y-2">
            <Spinner size="lg" color="primary" />
            <span className="text-sm">Primary</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Spinner size="lg" color="secondary" />
            <span className="text-sm">Secondary</span>
          </div>
          <div className="flex flex-col items-center space-y-2 bg-gray-800 p-4 rounded">
            <Spinner size="lg" color="white" />
            <span className="text-sm text-white">White</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Spinner size="lg" color="gray" />
            <span className="text-sm">Gray</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Button Examples</h3>
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            <Spinner size="sm" color="white" />
            <span>Loading...</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
            <Spinner size="sm" color="secondary" />
            <span>Processing...</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpinnerTest;

