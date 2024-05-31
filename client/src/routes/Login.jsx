import React, { useState } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/login",
        {
          email: formData.email,
          password: formData.password,
        },
        {
          withCredentials: true,
        }
      );
      setMessage(response.data.message);
      navigate("/");
    } catch (err) {
      console.error("Error: ", err.response?.data?.message);
      setMessage(
        err.response?.data?.message || "An error occurred while logging in."
      );
    }
  };

  const handleGoogleLogin = async () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  const handleFacebookLogin = async () => {
    window.location.href = "http://localhost:5000/auth/facebook/callback";
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-2 p-2 w-full border rounded focus:outline-none focus:ring focus:border-blue-300"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-2 p-2 w-full border rounded focus:outline-none focus:ring focus:border-blue-300"
                required
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Login
              </button>
              {message && (
                <div className="mt-2 text-center text-sm text-red-600">
                  {message}
                </div>
              )}
            </div>
          </form>
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 text-gray-500">or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          <div>
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition-colors mb-2"
            >
              Login with Google
            </button>
            <button
              onClick={handleFacebookLogin}
              className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800 transition-colors"
            >
              Login with Facebook
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
