"use client";

import { useEffect, useState } from "react";
import Link from "next/link"; // For navigating to the edit page
import { getAllSchool } from "@/lib/school"; // Adjust path if needed
import { SchoolPayload } from "@/lib/type";

export default function AllSchoolsPage() {
  const [schools, setSchools] = useState<SchoolPayload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await getAllSchool();
        // Adjust "res.data" if your backend returns the array inside a different property
        setSchools(res.data || []); 
      } catch (err) {
        console.error("Failed to fetch schools", err);
        setError("Failed to load schools. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();
  }, []);

  // 1. Loading State
  if (isLoading) return <div className="p-6 text-gray-600">Loading school data...</div>;

  // 2. Error State
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  // 3. Empty State
  if (schools.length === 0) return <div className="p-6 text-gray-500">No schools found.</div>;

  // 4. Success State
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Schools</h1>
        {/* Optional: A button to go to your Add School page */}
        <Link 
          href="/schools/add" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New School
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Board</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schools.map((school) => (
              <tr key={school.id || school.school_info?.name} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{school.school_info?.name}</div>
                  <div className="text-sm text-gray-500">{school.school_info?.type}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {school.school_info?.board} ({school.school_info?.medium})
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {school.address?.city}, {school.address?.state}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    school.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {school.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* Assumes your edit route looks like /schools/[id] */}
                  <Link 
                    href={`/schools/${school.id}`} 
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}