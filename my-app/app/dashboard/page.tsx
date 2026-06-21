"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllSchool } from "@/lib/school";
import { SchoolPayload } from "@/lib/type";

export default function AllSchoolsPage() {
  const [schools, setSchools] = useState<SchoolPayload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchools = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getAllSchool();
        setSchools(res.data || []);
      } catch (err) {
        console.error("Failed to fetch schools", err);
        setError("Failed to load schools. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchSchools();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (isLoading)
    return <div className="p-6 text-gray-600">Loading school data...</div>;
  if (error)
    return <div className="p-6 text-red-500">{error}</div>;
  if (schools.length === 0)
    return <div className="p-6 text-gray-500">No schools found.</div>;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">All Schools</h1>
        <Link
          href="/schools/add"
          className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-blue-700 text-sm sm:text-base whitespace-nowrap"
        >
          + Add School
        </Link>
      </div>

      {/* ── DESKTOP TABLE (unchanged, hidden on mobile) ── */}
      <div className="hidden sm:block bg-white shadow rounded-lg overflow-hidden border border-gray-200">
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
              <tr
                key={school._id || school.school_info?.name}
                className="hover:bg-gray-50"
              >
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
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      school.status === 1
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {school.status === 1 ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/schools/${school._id}`}
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

      {/* ── MOBILE CARDS (shown only on small screens) ── */}
      <div className="sm:hidden space-y-3">
        {schools.map((school) => (
          <div
            key={school._id || school.school_info?.name}
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-4"
          >
            {/* Card header: name + status */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="font-semibold text-gray-900 text-base leading-tight">
                  {school.school_info?.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{school.school_info?.type}</p>
              </div>
              <span
                className={`shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${
                  school.status === 1
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {school.status === 1 ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Card details */}
            <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600 mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-0.5">Board</p>
                <p>{school.school_info?.board}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-0.5">Medium</p>
                <p>{school.school_info?.medium}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-0.5">Location</p>
                <p>{school.address?.city}, {school.address?.state}</p>
              </div>
            </div>

            {/* Card action */}
            <Link
              href={`/schools/${school._id}`}
              className="block w-full text-center bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-md py-2 text-sm font-medium hover:bg-indigo-100 active:bg-indigo-200 transition-colors"
            >
              Edit School
            </Link>
          </div>
        ))}
      </div>

      {/* School count footer */}
      <p className="mt-4 text-xs text-gray-400 text-right">
        {schools.length} school{schools.length !== 1 ? "s" : ""} total
      </p>
    </div>
  );
}