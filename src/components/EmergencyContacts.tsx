'use client'

import React from "react";

const EmergencyContacts: React.FC = () => {
  const contacts = [
    { role: "Patient", name: "John Doe", phone: "+1 234 567 890" },
    { role: "Doctor", name: "Dr. Smith", phone: "+1 987 654 321" },
    { role: "Nurse", name: "Mary Jane", phone: "+1 122 334 455" },
  ];

  return (
    <div className="card bg-white shadow-lg rounded-lg p-4">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Emergency Contacts</h2>
      {contacts.map((contact, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-3 mb-2 bg-gray-50 rounded-lg"
        >
          <div>
            <h3 className="text-sm font-medium text-gray-700">{contact.role}</h3>
            <p className="text-sm text-gray-500">{contact.name}</p>
            <p className="text-sm text-gray-500">{contact.phone}</p>
          </div>
          <button
            onClick={() => (window.location.href = `tel:${contact.phone}`)}
            className="bg-green-500 text-white text-sm px-3 py-1 rounded-lg"
          >
            Call
          </button>
        </div>
      ))}
    </div>
  );
};

export default EmergencyContacts;
