'use client'
import BPLevelsChart from "@/components/BPLevels";
import CholestrolLvl from "@/components/Cholesterol";
import HeartRate from "@/components/HeartRate";
import PatientInfo from "@/components/PatientInfo";
import ReportView from "@/components/Reportview";
import SugarLvl from "@/components/SugarLevels";
import axios from "axios";
import { useEffect, useState } from "react";

export default function Home() {

  const [storedData, setStoredData] = useState<string | null>(null);
  const [Doctor, setDoctor] = useState<string | null>(null);

  useEffect(() => {
    // Get data from localStorage
    const data = localStorage.getItem("patientData"); // Replace 'keyName' with your key

    console.log(JSON.parse(data || "null").name);
    setStoredData(JSON.parse(data || "null"));
    console.log(JSON.parse(data || "null").assigned_doctor)
    getDoctor(JSON.parse(data || "null").assigned_doctor);

  }, []); // Runs once on component mount\


  const getDoctor = async (id: string) => {
    try {
      const response = await axios.post("/api/get/doctorbyid", { id });
      console.log(response.data);
      setDoctor(response.data.data.name);
    } catch (error) {
      console.error(error);
    }
  }

  

  return (
    <div className=" min-h-screen bg-gray-100">
      <div className="w-full h-[8vh] bg-blue-600 mb-6">

      </div>
      <div className="flex flex-col space-y-4 w-full justify-center items-center">
      <PatientInfo
        name={String(storedData?.name) || "John Doe"}
        gender={String(storedData?.gender) || "Others"}
        age={Number(storedData?.age) || 0}
        RoomNumber={String(storedData?.room_number) || "John Doe"}
        doctor={Doctor  || "Dr. John Doe"}
        imageUrl="https://via.placeholder.com/150" // Replace with actual image URL
      />

<div className="flex space-x-2">
<BPLevelsChart />
<CholestrolLvl/>
<HeartRate/>
<SugarLvl/>
</div>

<div className="flex">
  <div >
  <ReportView/>

  </div>

  
</div>
    
</div>
    </div>

    
  );
}
