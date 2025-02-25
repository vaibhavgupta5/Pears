'use client';

import React from 'react';
import Image from 'next/image';
import { Montserrat } from 'next/font/google';
import { useRouter } from 'next/navigation';

const montserrat = Montserrat({ subsets: ['latin'] });

export default function HealthCareMonitoringSystem() {
  return (
    <div className={`${montserrat.className} min-h-screen flex flex-col`}>
      <Header />
      <main className="flex-grow">
        <Hero />
        <Dashboard />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  const router = useRouter();

  return (
    <header className="bg-white py-4 px-8 flex justify-between items-center shadow-md sticky top-0 z-10">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-blue-600 rounded-full mr-2"></div>
        <h1 className="text-2xl font-bold text-blue-600">Care Link</h1>
      </div>
      <nav className="hidden md:block">
        <ul className="flex space-x-6">
          {['Platform', 'Solutions', 'Resources', 'Company', 'Pricing'].map((item) => (
            <li key={item}>
              <a href={`#${item.toLowerCase()}`} className="text-gray-700 hover:text-blue-600 transition-colors">
                {item}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="space-x-4">
       
        <button onClick={() => router.push("https://github.com/vaibhavgupta5/Patient_Dashboard")} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
          Source Code
        </button>
      </div>
    </header>
  );
}

function Hero() {
  
  const router = useRouter();
  
  return (
    <section className="py-20 px-8 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-6xl mx-auto md:flex items-center justify-between">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Revolutionizing <span className="text-blue-600">Healthcare</span> Monitoring
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Deliver quality healthcare services and improve patient experience. Track diagnostic trends, patient
            satisfaction, and more with our comprehensive monitoring system.
          </p>
          <div className="space-x-4">
            <button onClick={() => router.push("/patient/login")} className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
              Patient Dashboard
            </button>
            <button onClick={() => router.push("/doctor/chat")} className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-md hover:bg-blue-50 transition-colors">
              Doctor Chat
            </button>
          </div>
        </div>
        <div className="md:w-1/2">
          <Image
            src="https://plus.unsplash.com/premium_photo-1661769167673-cfdb37f156d8?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Healthcare professionals with patient"
            width={600}
            height={400}
            className="rounded-lg shadow-xl"
          />
        </div>
      </div>
    </section>
  );
}

function Dashboard() {
  const router = useRouter();

  const dashboardItems = [
    { title: 'Doctor Chat', description: 'Chat with doctors in real time.', icon: '💬', link: '/doctor/chat' },
    { title: 'Manage Patient', description: 'View and update patient detail.', icon: '👤', link:'/patient/login' },
    { title: 'All Patients', description: 'View and update all patient details.', icon: '👥', link:'/patient/all' },
    { title: 'Add Vitals', description: 'Add or update patient vitals.', icon: '❤', link: '/nurse/addVitals' },
    { title: 'Add Doctors', description: 'Add new doctors to the system.', icon: '👨‍⚕', link: '/doctor/addNew' },
    { title: 'Add Nurses', description: 'Add new nurses to the system.', icon: '👩‍⚕' , link: '/nurse/addNew' },
    { title: 'Add Patients', description: 'Add new patients to the system.', icon: '🏥' , link:'/patient/addNew'},
  ];

  return (
    <section className="py-20 px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Healthcare Monitoring Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dashboardItems.map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl cursor-pointer transition-shadow" onClick={() => router.push(item.link || "/")} >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const footerSections = [
    {
      title: 'Company',
      links: ['About', 'Customers', 'Careers', 'Contact Us'],
    },
    {
      title: 'Solutions',
      links: ['For Hospitals', 'For Clinics', 'For Laboratories', 'For Pharmaceuticals'],
    },
    {
      title: 'Resources',
      links: ['Blog', 'Whitepapers', 'Webinars', 'Documentation'],
    },
    {
      title: 'Legal',
      links: ['Privacy Policy', 'Terms of Service', 'Security', 'Compliance'],
    },
  ];

  return (
    <footer className="bg-gray-800 text-white py-12 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {footerSections.map((section, index) => (
            <div key={index}>
              <h4 className="font-bold mb-4 text-lg">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={`#${link.toLowerCase().replace(' ', '-')}`}
                      className="hover:text-blue-400 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
          <p>&copy; 2023 HealthCare Monitor. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
