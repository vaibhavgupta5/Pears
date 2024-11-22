'use client';

import React, { useState } from "react";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";


const LoginPage: React.FC = () => {
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const router = useRouter()

  const togglePassword = (): void => {
    setPasswordVisible(!passwordVisible);
  };

  const validateForm = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const email = (document.getElementById("email") as HTMLInputElement).value;
    console.log(email)
    const password = (document.getElementById("password") as HTMLInputElement)
      .value;
      console.log(password)

    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

    if (!email) {
      alert("Please enter your email.");
      return;
    } else if (!emailPattern.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (!password) {
      alert("Please enter your password.");
      return;
    }

    if(email == "test@test.com" && password == "12345678") {
      console.log("first")
      router.push("/dashboard");
      alert("Login successful!");
      return;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-500 via-teal-500 to-green-400">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-500 mb-8">
            <Shield className="h-8 w-8 text-blue-500" />
            Medflex
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
            Login
          </h2>

          {/* Login Form */}
          <form id="login-form" onSubmit={validateForm} className="text-black">
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Your email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                required
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-300 focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Your password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  id="password"
                  placeholder="Enter password"
                  required
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-300 focus:outline-none"
                />
                <div
                  className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-400 hover:text-green-500"
                  onClick={togglePassword}
                >
                  {passwordVisible ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </div>
              </div>
            </div>

            <a
              href="#"
              className="text-sm text-green-500 hover:underline mb-4 inline-block text-right"
            >
              Forgot password?
            </a>

            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 px-4 rounded-md font-medium hover:bg-green-600 transition"
            >
              Login
            </button>

            <div className="mt-4 text-center text-sm">
              Not registered?{" "}
              <a href="#" className="text-blue-500 font-semibold hover:underline">
                Signup
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
