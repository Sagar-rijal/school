"use client";

import { useState } from "react";
// Assuming you have your apiRequest wrapper from our previous steps!
import { apiRequest } from "@/lib/api"; 

export default function CreateUserPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Flat React State (Easy to manage)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone_number: "",
    father_name: "",
    mother_name: "",
    dob: "",
    id_number: "",
    current_address: "",
    permanent_address: "",
    gurdian_name: "", // Keeping the exact spelling from your schema
    gurdian_contact: ""
  });

  // Generic change handler for all inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    // 2. The Payload Mapper (Prevents data leaks!)
    const finalPayload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone_number: formData.phone_number,
      userPersonalInfo: {
        father_name: formData.father_name,
        mother_name: formData.mother_name,
        dob: formData.dob,
        id_number: formData.id_number,
        current_address: formData.current_address,
        permanent_address: formData.permanent_address,
        gurdian_name: formData.gurdian_name,
        gurdian_contact: formData.gurdian_contact
      }
    };

    try {
      // 3. Make the API request using your cookie-enabled wrapper
      const response = await apiRequest("/user/", {
        method: "POST",
        body: finalPayload
      });

      setSuccessMsg("User created successfully!");
      
      // Clear form on success
      setFormData({
        name: "", email: "", password: "", phone_number: "",
        father_name: "", mother_name: "", dob: "", id_number: "",
        current_address: "", permanent_address: "", gurdian_name: "", gurdian_contact: ""
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create user.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New User</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {successMsg && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{successMsg}</div>}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded shadow border">
        
        {/* SECTION 1: Basic Info */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange}
                className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange}
                className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input required type="password" name="password" value={formData.password} onChange={handleChange}
                className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input required type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange}
                className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </div>

        {/* SECTION 2: Personal Info */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Father&apos;s Name</label>
              <input type="text" name="father_name" value={formData.father_name} onChange={handleChange}
                className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mother&apos;s Name</label>
              <input type="text" name="mother_name" value={formData.mother_name} onChange={handleChange}
                className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange}
                className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Number (Aadhar/PAN)</label>
              <input type="text" name="id_number" value={formData.id_number} onChange={handleChange}
                className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Address</label>
              <input type="text" name="current_address" value={formData.current_address} onChange={handleChange}
                className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Address</label>
              <input type="text" name="permanent_address" value={formData.permanent_address} onChange={handleChange}
                className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guardian&apos;s Name</label>
              <input type="text" name="gurdian_name" value={formData.gurdian_name} onChange={handleChange}
                className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guardian&apos;s Contact</label>
              <input type="tel" name="gurdian_contact" value={formData.gurdian_contact} onChange={handleChange}
                className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isLoading ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}