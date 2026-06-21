"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
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

  // 1. Input Sanitization: Auto-lowercase email
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "email" ? value.toLowerCase() : value,
    }));
  };

  // 2. Client-Side Validation Logic
  const isFormValid = () => {
    const { name, email, phone, establishedYear, addressLine1, city, state, pincode } = formData;
    
    // Basic regex patterns
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/; // Assumes 10-digit standard phone
    const pinRegex = /^\d{6}$/;    // Assumes 6-digit Indian PIN code
    
    // Check required fields are not empty
    if (!name.trim() || !addressLine1.trim() || !city.trim() || !state.trim()) return false;
    
    // Check formats
    if (!emailRegex.test(email)) return false;
    if (!phoneRegex.test(phone)) return false;
    if (!pinRegex.test(pincode)) return false;
    
    // Check logical dates
    const year = Number(establishedYear);
    const currentYear = new Date().getFullYear();
    if (year < 1800 || year > currentYear) return false;

    return true;
  };

  // 3. Strict typing for the event
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        school_info: {
          name: formData.name.trim(),
          board: formData.board,
          medium: formData.medium,
          type: formData.type,
          establishedYear: Number(formData.establishedYear),
        },
        contact_info: {
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          website: formData.website.trim(),
          brandingLogo: formData.brandingLogo.trim(),
        },
        address: {
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          country: formData.country,
        },
        status: Number(formData.status),
      };

      const response = await addSchool(payload);
      console.log("School added successfully:", response);

      setSuccess("School registered successfully");

      // Reset form on success
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
        setError("Registration failed. Please try again.");
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

      <p className="text-center text-sm text-gray-500 mb-6">
        Fill in school details to register
      </p>

      <input
        type="text"
        name="name"
        required
        placeholder="School name *"
        value={formData.name}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Changed to select dropdowns for restricted values */}
        <select
          name="board"
          value={formData.board}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
        >
          <option value="CBSE">CBSE</option>
          <option value="ICSE">ICSE</option>
          <option value="STATE">State Board</option>
          <option value="IB">IB</option>
        </select>

        <select
          name="medium"
          value={formData.medium}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
        >
          <option value="HINDI">Hindi</option>
          <option value="ENGLISH">English</option>
          <option value="REGIONAL">Regional</option>
        </select>

        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
        >
          <option value="GOVT">Government</option>
          <option value="PRIVATE">Private</option>
          <option value="AIDED">Aided</option>
        </select>

        <input
          type="number"
          name="establishedYear"
          required
          min="1800"
          max={new Date().getFullYear()}
          placeholder="Established year *"
          value={formData.establishedYear}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
        />
      </div>

      <input
        type="email"
        name="email"
        required
        placeholder="Official Email *"
        value={formData.email}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
      />

      <input
        type="tel"
        name="phone"
        required
        maxLength={10}
        placeholder="Phone (10 digits) *"
        value={formData.phone}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
      />

      <input
        type="url"
        name="website"
        placeholder="Website (https://...)"
        value={formData.website}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
      />

      <input
        type="url"
        name="brandingLogo"
        placeholder="Branding logo URL"
        value={formData.brandingLogo}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
      />

      <input
        type="text"
        name="addressLine1"
        required
        placeholder="Address line 1 *"
        value={formData.addressLine1}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
      />

      <input
        type="text"
        name="addressLine2"
        placeholder="Address line 2 (Optional)"
        value={formData.addressLine2}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <input
          type="text"
          name="city"
          required
          placeholder="City *"
          value={formData.city}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
        />

        <input
          type="text"
          name="state"
          required
          placeholder="State *"
          value={formData.state}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
        />

        <input
          type="text"
          name="pincode"
          required
          maxLength={6}
          placeholder="Pincode (6 digits) *"
          value={formData.pincode}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-300"
        />

        <input
          type="text"
          name="country"
          readOnly
          value={formData.country}
          className="w-full cursor-not-allowed rounded-xl border border-gray-300 bg-gray-100 p-3 text-gray-500 outline-none"
        />
      </div>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}
      {success && <p className="text-sm font-medium text-green-600">{success}</p>}

      <button
        type="submit"
        // 4. Button is disabled if loading OR if form validation fails
        disabled={loading || !isFormValid()}
        className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
      >
        {loading ? "Submitting..." : "Register School"}
      </button>
    </form>
  );
}