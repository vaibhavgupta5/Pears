'use client';

import React, { useState } from 'react';
import axios from 'axios';
import qs from 'qs';

const AddReportPage: React.FC = () => {
  const [formData, setFormData] = useState({
    room_number: '',
    patient_id: '',
    nurse_id: '',
    report_date: '',
    medications_administered: '',
    message: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const fetchRoomData = async (roomNumber: string) => {
    try {
      const response = await axios.post('/api/get/getpatientbyroom', { room_number: roomNumber });
      const data = response.data.body.data;
      

      if (!data || !data._id) {
        setErrorMessage('No patient found for the given room number.');
        return;
      }

      setFormData((prevFormData) => ({
        ...prevFormData,
        patient_id: data._id || '',
        nurse_id: data.assigned_nurse || '',
      }));

      setErrorMessage(null);
    } catch (error: any) {
      console.error('Error fetching room data:', error);
      setErrorMessage('Invalid room number or unable to fetch details.');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!file) {
      setErrorMessage('Please upload a prescription file.');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Upload file to the `upload` API
      const fileData = new FormData();
      fileData.append('file', file);

      const uploadResponse = await axios.post('/api/upload', fileData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedFileUrl = uploadResponse.data.url;

      console.log(uploadResponse.data);

      // Step 2: Submit report data to the `addReport` API
      const reportData = qs.stringify({
        patient_id: formData.patient_id,
        nurse_id: formData.nurse_id,
        report_date: formData.report_date,
        medications_administered: formData.medications_administered.split(','),
        message: formData.message,
        file_url: uploadedFileUrl,
      });

      const reportResponse = await axios.post('/api/create/addReport', reportData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      setSuccessMessage(reportResponse.data.body.message);
      setFile(null); // Reset file input
      setFormData({
        room_number: '',
        patient_id: '',
        nurse_id: '',
        report_date: '',
        medications_administered: '',
        message: '',
      });
    } catch (error: any) {
      console.error('Error submitting report:', error);
      setErrorMessage('Failed to add the report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-blue-100 p-6">
      <h1 className="text-3xl font-bold text-blue-800 text-center mb-8">Add Report</h1>
      <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-lg">
        {errorMessage && <p className="mb-4 text-red-600 font-semibold">{errorMessage}</p>}
        {successMessage && <p className="mb-4 text-green-600 font-semibold">{successMessage}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Number */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Room Number</label>
            <input
              type="text"
              name="room_number"
              value={formData.room_number}
              onChange={(e) => {
                handleInputChange(e);
                fetchRoomData(e.target.value);
              }}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {/* Report Date */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Report Date</label>
            <input
              type="date"
              name="report_date"
              value={formData.report_date}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {/* Medications Administered */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Medications Administered</label>
            <input
              type="text"
              name="medications_administered"
              value={formData.medications_administered}
              onChange={handleInputChange}
              placeholder="Enter medications separated by commas"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Enter any additional message"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            ></textarea>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Upload Prescription</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition duration-300 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddReportPage;
