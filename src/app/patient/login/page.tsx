'use client'
import React, { useState } from "react";
import axios from "axios";
import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";

const PatientLoginPage: React.FC = () => {
  const [room_number, setRoom] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();


  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      console.log(room_number)
      // API call with Axios
      const response = await axios.post("/api/get/getpatientbyroom", { room_number });

      // Assuming API response contains a patient object
      const { data } = response;
      console.log(response.data)

      

      // Save necessary data to localStorage
      localStorage.setItem("patientData", JSON.stringify(data.body.data));
      localStorage.setItem("login", "true"); // Save login status
      setError(null);

      // Redirect to dashboard
      router.push("/patient/dashboard");
      
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to login. Try again.");
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-500 via-teal-500 to-green-400">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-500 mb-8">
            <Shield className="h-8 w-8 text-blue-500" />
            Medflex - Patient Login
          </div>


          {/* Error Message */}
          {error && (
            <div className="mb-4 p-2 text-sm text-red-500 bg-red-100 rounded">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="text-black">
            {/* Room Field */}
            <div className="mb-4">
              <label
                htmlFor="room"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Room <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="room"
                placeholder="Enter your room number"
                value={room_number}
                onChange={(e) => setRoom(e.target.value)}
                required
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-300 focus:outline-none"
              />
            </div>

          

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 px-4 rounded-md font-medium hover:bg-green-600 transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientLoginPage;
