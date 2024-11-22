'use client';

import BPLevelsChart from "@/components/BPLevels";
import CholestrolLvl from "@/components/Cholesterol";
import EmergencyContact from "@/components/EmergencyContact";
import HeartRate from "@/components/HeartRate";
import PatientInfo from "@/components/PatientInfo";
import ReportView from "@/components/Reportview";
import SugarLvl from "@/components/SugarLevels";
import axios from "axios";
import { useEffect, useState } from "react";

export default function Home() {
  const [storedData, setStoredData] = useState<any>(null);
  const [Doctor, setDoctor] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [healthMetrics, setHealthMetrics] = useState<any[]>([]); // Patient vitals
  const [analysis, setAnalysis] = useState<string | null>(null); // AI Prediction result
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get data from localStorage
    const data = localStorage.getItem("patientData");
    if (data) {
      const parsedData = JSON.parse(data);
      setStoredData(parsedData);
      getDoctor(parsedData.assigned_doctor);
      getHealthMetrics(parsedData.room_number);
    }
  }, []);

  const getDoctor = async (id: string) => {
    try {
      const response = await axios.post("/api/get/doctorbyid", { id });
      setDoctor(response.data.data.name);
    } catch (error) {
      console.error("Error fetching doctor data:", error);
    }
  };

  const getHealthMetrics = async (roomNumber: string) => {
    try {
      const response = await axios.post("/api/get/getpatientbyroom", { room_number: roomNumber });
      const patientInfo = response.data.body.data;
      setHealthMetrics(patientInfo.health_metrics || []);
    } catch (err: any) {
      console.error("Error fetching health metrics data:", err);
    }
  };

  const analyzeVitals = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await axios.post('/api/ai/health-analysis', { healthMetrics });
      setAnalysis(response.data.result); // Store AI prediction result
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error analyzing health vitals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Section */}
      <div className="w-full fixed top-0 h-[10vh] bg-blue-600 flex items-center justify-between px-6 shadow-md">
        <div className="text-white text-lg font-bold">Care Link</div>
        <div className="flex gap-4">
          <button
            className="px-4 py-2 bg-white text-blue-600 rounded-md font-medium shadow hover:bg-blue-100 transition"
            onClick={() => setIsModalOpen(true)} // Open modal
          >
            AI Prediction
          </button>
        </div>
      </div>

      {/* Welcome Section
      <div className="w-full bg-blue-100 text-blue-900 py-4 px-6 shadow">
        <h2 className="text-xl font-semibold">
          Welcome, {storedData?.name || "Patient"}!
        </h2>
        <p className="text-sm">We are here to ensure your health is our priority.</p>
      </div> */}

      {/* Main Content */}
      <div className="flex pt-[13vh] flex-col pb-6 space-y-6 w-[100%] justify-center items-center">
        <PatientInfo
          name={String(storedData?.name) || "John Doe"}
          gender={String(storedData?.gender) || "Others"}
          age={Number(storedData?.age) || 0}
          RoomNumber={String(storedData?.room_number) || "A-101"}
          doctor={Doctor || "Dr. John Doe"}
          imageUrl="https://img.freepik.com/free-photo/portrait-3d-female-doctor_23-2151107332.jpg"
        />

        {/* Detailed Health Charts Section */}
        <div className="flex space-x-2">
          <BPLevelsChart />
          <CholestrolLvl />
          <HeartRate />
          <SugarLvl />
        </div>

        {/* Additional Info Section */}
        <div className="flex space-x-3 w-[89.5%]">
          <div className="w-[50%]">
            <ReportView />
          </div>
          <div className="w-[50%]">
            <EmergencyContact />
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="w-full bg-blue-600 py-2 text-center text-white text-sm">
        &copy; 2024 Care Link. All rights reserved.
      </div>

      {/* Modal */}
      {isModalOpen && (
  <div className="fixed overflow-y-scroll inset-0 bg-black bg-opacity-50 flex justify-end z-50"
  onClick={() => setIsModalOpen(false)} >
    <div className="bg-white h-full w-[30%] shadow-lg relative"
    onClick={(e) => e.stopPropagation()} >
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-black text-lg"
        onClick={() => setIsModalOpen(false)} // Close sidebar
      >
        &times;
      </button>
      <div className="p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-4">AI Prediction</h2>
        <div className="mb-4 text-black mt-2">
          <p className="pb-4">Analyze the collected health metrics using AI.</p>
          <button
            onClick={analyzeVitals}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Vitals'}
          </button>
        </div>
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
  </div>
)}

    </div>
  );
}
