'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HealthAnalysis = () => {
  const [healthMetrics, setHealthMetrics] = useState<any[]>([]); // Array of all vitals
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch all vitals based on room number from localStorage
    const fetchVitals = async () => {
      const data = localStorage.getItem('patientData'); // Retrieve patient data from localStorage
      if (!data) {
        setError('Room number not found in local storage.');
        return;
      }

      const patientData = JSON.parse(data);
      const { room_number } = patientData;

      try {
        const response = await axios.post('/api/get/getpatientbyroom', { room_number });

        const patientInfo = response.data.body.data;
        const metrics = patientInfo.health_metrics || [];

        // Update healthMetrics state
        setHealthMetrics(metrics);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching health metrics data.');
      }
    };

    fetchVitals();
  }, []);

  const handleAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      // Send all health metrics for analysis
      const response = await axios.post('/api/ai/health-analysis', { healthMetrics });

      // Store the analysis result
      setAnalysis(response.data.result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error analyzing health vitals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-md p-6 rounded-lg">
      <h1 className="text-2xl font-bold text-center text-blue-600 mb-4">
        Health Vitals Analysis
      </h1>

      {/* Display All Vitals */}
      <div className="mb-6">
        {healthMetrics.map((metric, index) => (
          <div
            key={index}
            className="mb-4 p-4 border rounded-md shadow-sm bg-gray-50"
          >
            <h2 className="font-bold text-lg text-blue-600 mb-2">Entry {index + 1}</h2>
            <p className="text-sm text-gray-700">
              <strong>Heart Rate:</strong> {metric.heart_rate || 'N/A'} bpm
            </p>
            <p className="text-sm text-gray-700">
              <strong>Blood Pressure:</strong> {metric.blood_pressure?.systolic || 'N/A'}/{metric.blood_pressure?.diastolic || 'N/A'} mmHg
            </p>
            <p className="text-sm text-gray-700">
              <strong>Oxygen Saturation:</strong> {metric.oxygen_saturation || 'N/A'}%
            </p>
            <p className="text-sm text-gray-700">
              <strong>Respiratory Rate:</strong> {metric.respiratory_rate || 'N/A'} breaths/min
            </p>
            <p className="text-sm text-gray-700">
              <strong>Temperature:</strong> {metric.temperature || 'N/A'}°F
            </p>
            <p className="text-sm text-gray-700">
              <strong>Date:</strong> {new Date(metric.updated_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleAnalysis}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Analyze All Vitals'}
      </button>

      {/* Results Section */}
      <div className="mt-6">
        {analysis && (
          <div
            className="p-4 bg-green-100 text-green-700 rounded-md"
            dangerouslySetInnerHTML={{ __html: analysis }}
          />
        )}
        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-md">
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthAnalysis;
