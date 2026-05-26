// src/components/SchoolForm.tsx
"use client";

import { useState } from "react";
import type { ChangeEvent, SubmitEventHandler } from "react";

// 1. Define the Types for our Props and Data
export interface SchoolDataPayload {
  school_info: {
    name: string;
    board: string;
    medium: string;
    type: string;
    establishedYear: string | number;
  };
  contact_info: {
    email: string;
    phone: string;
    website: string;
    brandingLogo: string;
  };
  address: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
}

interface SchoolFormProps {
  initialData?: SchoolDataPayload; // Will be passed when editing
  onSubmit: (payload: SchoolDataPayload & { status: number }) => Promise<{ data?: { school_id?: string } }>;
  isEditMode?: boolean; // Tells the UI to say "Edit" or "Add"
}

export default function SchoolForm({ initialData, onSubmit, isEditMode = false }: SchoolFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [schoolId, setSchoolId] = useState("");

  // 2. Initialize state with initialData if it exists, otherwise use empty strings
  const [formData, setFormData] = useState<SchoolDataPayload>(
    initialData || {
      school_info: { name: "", board: "", medium: "", type: "", establishedYear: "" },
      contact_info: { email: "", phone: "", website: "", brandingLogo: "" },
      address: { addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", country: "" },
    }
  );

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

  // 3. We removed the hardcoded `addSchool` and replaced it with the `onSubmit` prop
 const handleSubmit: SubmitEventHandler<HTMLFormElement>= async (e) =>  {
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
        status: 1, // Assuming status 1 is active
      };

      // Call the parent's function (could be POST or PUT)
      const res = await onSubmit(payload);

      setSuccess(isEditMode ? "School updated successfully!" : "School added successfully!");
      
      // Only set/save schoolId if we are adding a new school and the backend returns it
      if (!isEditMode && res?.data?.school_id) {
        setSchoolId(res.data.school_id);
        localStorage.setItem("schoolId", res.data.school_id);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(isEditMode ? "Failed to update school" : "Failed to add school");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className=" p-6 md:mx-40 ">
      {/* 4. Dynamic Titles based on Mode */}
      <h1 className="mb-6 text-2xl font-bold text-center md:mx-auto md: w-1/2">
        {isEditMode ? "Edit School" : "Add School"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-xl border p-6 shadow-2xl">
        <div>
          <h2 className="mb-4 text-lg font-semibold">School Info</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="name"
              type="text"
              placeholder="School Name"
              value={formData.school_info.name}
              onChange={(e) => handleChange(e, "school_info")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="board"
              type="text"
              placeholder="Board (e.g., CBSE)"
              value={formData.school_info.board}
              onChange={(e) => handleChange(e, "school_info")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="medium"
              type="text"
              placeholder="Medium (e.g., ENGLISH)"
              value={formData.school_info.medium}
              onChange={(e) => handleChange(e, "school_info")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="type"
              type="text"
              placeholder="Type (e.g., PRIVATE)"
              value={formData.school_info.type}
              onChange={(e) => handleChange(e, "school_info")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="establishedYear"
              type="number"
              placeholder="Established Year"
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
              value={formData.contact_info.email}
              onChange={(e) => handleChange(e, "contact_info")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="phone"
              type="text"
              placeholder="Phone"
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
              value={formData.address.addressLine1}
              onChange={(e) => handleChange(e, "address")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="addressLine2"
              type="text"
              placeholder="Address Line 2"
              value={formData.address.addressLine2}
              onChange={(e) => handleChange(e, "address")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="city"
              type="text"
              placeholder="City"
              value={formData.address.city}
              onChange={(e) => handleChange(e, "address")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="state"
              type="text"
              placeholder="State"
              value={formData.address.state}
              onChange={(e) => handleChange(e, "address")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="pincode"
              type="text"
              placeholder="Pincode"
              value={formData.address.pincode}
              onChange={(e) => handleChange(e, "address")}
              className="rounded-md border p-3 shadow"
            />
            <input
              name="country"
              type="text"
              placeholder="Country"
              value={formData.address.country}
              onChange={(e) => handleChange(e, "address")}
              className="rounded-md border p-3 shadow"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
        {schoolId && !isEditMode && <p className="text-sm text-blue-600">School ID: {schoolId}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Submitting..." : isEditMode ? "Save Changes" : "Add School"}
        </button>
      </form>
    </section>
  );
}