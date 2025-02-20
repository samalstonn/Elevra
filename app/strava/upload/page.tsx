"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StravaUploadPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  useEffect(() => {
    // Get the Strava access token from query params
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      setAccessToken(token);
    } else {
      // Redirect back if no token is found
      router.push("/strava");
    }
  }, [router]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!accessToken) {
      setUploadStatus("Error: No Strava access token found.");
      return;
    }

    if (!selectedFile) {
      setUploadStatus("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("data_type", "fit"); // Change if using GPX/TCX
    formData.append("name", "Custom Workout Upload");
    formData.append("description", "Uploaded via NHVote Strava integration");
    formData.append("activity_type", "ride"); // Change to "row" if needed

    try {
      setUploadStatus("Uploading...");

      const response = await fetch("https://www.strava.com/api/v3/uploads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        setUploadStatus(`Upload Failed: ${data.error}`);
      } else {
        setUploadStatus("Upload Successful! Your workout is processing.");
      }
    } catch (error) {
      setUploadStatus(`Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-4">Upload Workout to Strava</h1>
      <p className="text-gray-600 mb-6">Select a `.fit`, `.gpx`, or `.tcx` file to upload.</p>

      <input type="file" accept=".fit,.gpx,.tcx" onChange={handleFileChange} className="mb-4" />

      <button
        onClick={handleUpload}
        className="bg-blue-500 text-white px-6 py-2 rounded-md shadow-md hover:bg-blue-600 transition"
      >
        Upload Workout
      </button>

      {uploadStatus && <p className="mt-4 text-gray-700">{uploadStatus}</p>}
    </div>
  );
}