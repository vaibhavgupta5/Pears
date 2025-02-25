'use client';

import React, { useState, useEffect } from "react";
import axios from "axios";

const MedicineOrderPage: React.FC = () => {
  const [formData, setFormData] = useState({
    roomNumber: "",
    contactNumber: "",
    message: "",
    prescription: null,
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [medicines, setMedicines] = useState<string[]>([]);

  useEffect(() => {
    // Fetch room number and contact number from localStorage
    const patientData = localStorage.getItem("patientData");
    if (patientData) {
      const parsedData = JSON.parse(patientData);
      setFormData((prevData) => ({
        ...prevData,
        roomNumber: parsedData.room_number || "",
        contactNumber: parsedData.contact.phone || "",
      }));
      setMedicines(parsedData.prescription || ["Paracetamol", "Ibuprofen"]); // Example medicines
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prevData) => ({ ...prevData, prescription: file }));
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prevData) => ({ ...prevData, message: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setUploading(true);

    const { roomNumber, contactNumber, message, prescription } = formData;

    if (!roomNumber || !contactNumber || !prescription) {
      setError("Room number, contact number, and prescription are required.");
      setUploading(false);
      return;
    }

    try {
      // Convert the prescription file to Base64
      const reader = new FileReader();
      reader.readAsDataURL(prescription as File);
      reader.onloadend = async () => {
        const base64File = reader.result;

        const response = await axios.post("/api/medicine-order", {
          roomNumber,
          contactNumber,
          message,
          prescription: base64File,
        });

        setSuccess(response.data.message);
        setFormData((prevData) => ({
          ...prevData,
          message: "",
          prescription: null,
        }));
      };
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to place the order.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col text-black items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="w-full max-w-md bg-white p-6 shadow-md rounded-lg">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">Order Medicine</h2>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Number */}
          <input
            type="text"
            value={formData.roomNumber}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
          />

          {/* Contact Number */}
          <input
            type="text"
            value={formData.contactNumber}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
          />

      

          {/* Prescription Upload */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Upload Prescription
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              required
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer focus:outline-none"
            />
          </div>

          {/* Optional Message */}
          <textarea
            value={formData.message}
            onChange={handleMessageChange}
            placeholder="Add an optional message..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Place Order"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MedicineOrderPage;
