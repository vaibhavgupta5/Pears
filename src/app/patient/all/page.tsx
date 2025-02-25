'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleLogin = async (roomNumber: any, e: any) => {
    e.preventDefault();

    try {
      const response = await axios.post('/api/get/getpatientbyroom', { room_number: roomNumber });
      const { data } = response;

      localStorage.setItem('patientData', JSON.stringify(data.body.data));
      localStorage.setItem('login', 'true');
      setError(null);
      router.push('/patient/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login. Try again.');
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/get/allpatients');
        setUsers(response.data.body.data || []);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch users');
        console.error('API Fetch Error:', err);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <p className="text-center text-blue-600 font-semibold mt-8 text-lg">Loading users...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 font-semibold mt-8 text-lg">{error}</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-8">
      <h1 className="text-4xl font-extrabold text-blue-800 text-center mb-10">Patient Directory</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {users.map((user) => (
          <div
            key={user._id}
            className="bg-white shadow-md p-4 rounded-lg border border-gray-200 hover:shadow-lg transform hover:-translate-y-1 transition duration-300"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">{user.name}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Room:</span>
                <span className="text-gray-600">{user.room_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Age:</span>
                <span className="text-gray-600">{user.age || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Gender:</span>
                <span className="text-gray-600">{user.gender || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Contact:</span>
                <span className="text-gray-600">{user.contact?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Doctor:</span>
                <span className="text-gray-600">{user.assigned_doctor?.name || 'Not Assigned'}</span>
              </div>
            </div>
            <button
              onClick={(e) => handleLogin(user.room_number, e)}
              className="mt-4 w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 transition duration-300"
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersPage;
