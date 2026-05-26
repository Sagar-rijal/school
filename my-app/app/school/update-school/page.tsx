"use client";
import { useEffect, useState } from "react";
import SchoolForm from "@/components/school-form";
import { SchoolDataPayload } from "@/components/school-form";
// Assuming you have an editSchool and getSchool function in your lib
import { getSchool , updateSchool} from "@/lib/school";
export default function EditSchoolPage({ params }: { params: { id: string } }) {
  const [initialData, setInitialData] = useState<SchoolDataPayload | null>(null);

  useEffect(() => {
    // Fetch the existing school data when the page loads
    const fetchSchool = async () => {
      try {
        const res = await getSchool(params.id);
        setInitialData(res.data); // Adjust based on actual API response structure
      } catch (err) {
        console.error("Failed to fetch school",err);
      }
    };
    fetchSchool();
  }, [params.id]);

  // Wrap the edit function so we can pass the ID
  const handleEdit = async (payload: any) => {
    return await updateSchool(params.id, payload);
  };

  // Don't render the form until the data is fetched!
  if (!initialData) return <div className="p-6">Loading school data...</div>;

  return (
    <SchoolForm 
      initialData={initialData} 
      onSubmit={handleEdit} 
      isEditMode={true} 
    />
  );
}