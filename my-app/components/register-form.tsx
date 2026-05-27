"use client";

import { useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // temporary test
      setSuccess("Register page working");

      setFormData({
        name: "",
        phone_number: "",
        email: "",
        password: "",
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-10 w-[90%] max-w-lg space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl md:mt-20 md:p-10"
    >
      <h2 className="text-center text-3xl font-bold text-black">
        Create Account
      </h2>

      <p className="text-center text-sm text-gray-500">
        Fill in your details to register
      </p>

      <input
        type="text"
        name="name"
        placeholder="Enter name"
        value={formData.name}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none transition-all duration-200 focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
      />

      <input
        type="text"
        name="phone_number"
        placeholder="Enter phone number"
        value={formData.phone_number}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none transition-all duration-200 focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
      />

      <input
        type="email"
        name="email"
        placeholder="Enter email"
        value={formData.email}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none transition-all duration-200 focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
      />

      <input
        type="password"
        name="password"
        placeholder="Enter password"
        value={formData.password}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none transition-all duration-200 focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      {success && (
        <p className="text-sm text-green-600">{success}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-gray-800 active:scale-[0.98]"
      >
        {loading ? "Registering..." : "Register"}
      </button>
    </form>
  );
}