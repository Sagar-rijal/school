// src/components/AddSchoolForm.tsx
"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import { addSchool } from "@/lib/school";

export default function AddSchoolForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [schoolId, setSchoolId] = useState("");

  const [formData, setFormData] = useState({
    school_info: {
      name: "",
      board: "",
      medium: "",
      type: "",
      establishedYear: "",
    },
    contact_info: {
      email: "",
      phone: "",
      website: "",
      brandingLogo: "",
    },
    address: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      country: "",
    },
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>,
    section: "school_info" | "contact_info" | "address"
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e : React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setSchoolId("");

    try {
      const payload = {
        school_info: {
          ...formData.school_info,
          establishedYear: Number(formData.school_info.establishedYear),
        },
        contact_info: formData.contact_info,
        address: formData.address,
        status: 1,
      };

      const res = await addSchool(payload);

      setSuccess("School added successfully");
      setSchoolId(res.data.school_id);

      localStorage.setItem("schoolId", res.data.school_id);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to add school");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-1 my-1shadow p-6 md:mx-20 md:my-10 rounded-2xl">
      <h1 className="mb-6 text-2xl font-bold">Add School</h1>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-xl border p-6">
        <div>
          <h2 className="mb-4 text-lg font-semibold">School Info</h2>
          <div className="grid gap-4 md:grid-cols-2 ">
            <input
              name="name"
              type="text"
              placeholder="School Name"
              required
              value={formData.school_info.name}
              onChange={(e) => handleChange(e, "school_info")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="board"
              type="text"
              placeholder="Board"
              required
              value={formData.school_info.board}
              onChange={(e) => handleChange(e, "school_info")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="medium"
              type="text"
              placeholder="Medium"
              required
              value={formData.school_info.medium}
              onChange={(e) => handleChange(e, "school_info")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="type"
              type="text"
              placeholder="Type"
              required
              value={formData.school_info.type}
              onChange={(e) => handleChange(e, "school_info")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="establishedYear"
              type="number"
              placeholder="Established Year"
              required
              value={formData.school_info.establishedYear}
              onChange={(e) => handleChange(e, "school_info")}
              className="rounded-md border p-3 shadow"
            />
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Contact Info</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              value={formData.contact_info.email}
              onChange={(e) => handleChange(e, "contact_info")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="phone"
              type="text"
              placeholder="Phone"
              required
              value={formData.contact_info.phone}
              onChange={(e) => handleChange(e, "contact_info")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="website"
              type="text"
              placeholder="Website"
              value={formData.contact_info.website}
              onChange={(e) => handleChange(e, "contact_info")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="brandingLogo"
              type="text"
              placeholder="Branding Logo URL"
              value={formData.contact_info.brandingLogo}
              onChange={(e) => handleChange(e, "contact_info")}
              className="rounded-md border p-3 shadow"
            />
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Address</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="addressLine1"
              type="text"
              placeholder="Address Line 1"
              required
              value={formData.address.addressLine1}
              onChange={(e) => handleChange(e, "address")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="addressLine2"
              type="text"
              placeholder="Address Line 2 (Optional)"
              value={formData.address.addressLine2}
              onChange={(e) => handleChange(e, "address")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="city"
              type="text"
              placeholder="City"
              required
              value={formData.address.city}
              onChange={(e) => handleChange(e, "address")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="state"
              type="text"
              placeholder="State"
              required
              value={formData.address.state}
              onChange={(e) => handleChange(e, "address")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="pincode"
              type="text"
              placeholder="Pincode"
              required
              value={formData.address.pincode}
              onChange={(e) => handleChange(e, "address")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="country"
              type="text"
              placeholder="Country"
              required
              value={formData.address.country}
              onChange={(e) => handleChange(e, "address")}
              className="rounded-md border p-3 shadow"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
        {schoolId && <p className="text-sm text-blue-600">School ID: {schoolId}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Add School"}
        </button>
      </form>
    </section>
  );
}