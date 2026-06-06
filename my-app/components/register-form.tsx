"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import { addSchool } from "@/lib/school";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    board: "CBSE",
    medium: "HINDI",
    type: "GOVT",
    establishedYear: "",

    email: "",
    phone: "",
    website: "",
    brandingLogo: "",

    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",

    status: "1",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        school_info: {
          name: formData.name,
          board: formData.board,
          medium: formData.medium,
          type: formData.type,
          establishedYear: Number(formData.establishedYear),
        },
        contact_info: {
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          brandingLogo: formData.brandingLogo,
        },
        address: {
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: formData.country,
        },
        status: Number(formData.status),
      };

      const response = await addSchool(payload);
      console.log("School added successfully:", response);

      setSuccess("School registered successfully");

      setFormData({
        name: "",
        board: "CBSE",
        medium: "HINDI",
        type: "GOVT",
        establishedYear: "",
        email: "",
        phone: "",
        website: "",
        brandingLogo: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        status: "1",
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
      className="mx-auto mt-10 w-[90%] max-w-xl space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl md:mt-20 md:p-10"
    >
      <h2 className="text-center text-3xl font-bold text-black">
        Create School
      </h2>

      <p className="text-center text-sm text-gray-500">
        Fill in school details to register
      </p>

      <input
        type="text"
        name="name"
        placeholder="School name"
        value={formData.name}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <input
          type="text"
          name="board"
          placeholder="Board"
          value={formData.board}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
        />

        <input
          type="text"
          name="medium"
          placeholder="Medium"
          value={formData.medium}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
        />

        <input
          type="text"
          name="type"
          placeholder="Type"
          value={formData.type}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
        />

        <input
          type="number"
          name="establishedYear"
          placeholder="Established year"
          value={formData.establishedYear}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
        />
      </div>

      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
      />

      <input
        type="text"
        name="phone"
        placeholder="Phone"
        value={formData.phone}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
      />

      <input
        type="text"
        name="website"
        placeholder="Website"
        value={formData.website}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
      />

      <input
        type="text"
        name="brandingLogo"
        placeholder="Branding logo URL"
        value={formData.brandingLogo}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
      />

      <input
        type="text"
        name="addressLine1"
        placeholder="Address line 1"
        value={formData.addressLine1}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
      />

      <input
        type="text"
        name="addressLine2"
        placeholder="Address line 2"
        value={formData.addressLine2}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <input
          type="text"
          name="city"
          placeholder="City"
          value={formData.city}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
        />

        <input
          type="text"
          name="state"
          placeholder="State"
          value={formData.state}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
        />

        <input
          type="text"
          name="pincode"
          placeholder="Pincode"
          value={formData.pincode}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
        />

        <input
          type="text"
          name="country"
          placeholder="Country"
          value={formData.country}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Submitting..." : "Register"}
      </button>
    </form>
  );
}