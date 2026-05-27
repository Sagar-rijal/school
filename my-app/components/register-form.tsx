"use client";

import { useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import { registerUser } from "@/lib/auth";

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
      const res = await registerUser(formData);
      setSuccess(res.message || "User registered successfully");

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="name"
        placeholder="Enter name"
        value={formData.name}
        onChange={handleChange}
        className="w-full rounded border p-3"
      />

      <input
        type="text"
        name="phone_number"
        placeholder="Enter phone number"
        value={formData.phone_number}
        onChange={handleChange}
        className="w-full rounded border p-3"
      />

      <input
        type="email"
        name="email"
        placeholder="Enter email"
        value={formData.email}
        onChange={handleChange}
        className="w-full rounded border p-3"
      />

      <input
        type="password"
        name="password"
        placeholder="Enter password"
        value={formData.password}
        onChange={handleChange}
        className="w-full rounded border p-3"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-black px-4 py-3 text-white"
      >
        {loading ? "Registering..." : "Register"}
      </button>
    </form>
  );
}