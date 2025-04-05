"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, Image as ImageIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface PhotoUploadProps {
  currentPhotoUrl: string | null | undefined;
  candidateId: number;
  isPremium: boolean; // To control multi-photo upload later
}

// Basic Photo Upload Component - Needs Backend Integration for actual upload
export function PhotoUpload({
  currentPhotoUrl,
  candidateId,
  isPremium,
}: PhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentPhotoUrl || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic validation (e.g., file type, size)
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit example
        toast({
          title: "File Too Large",
          description: "Image size should not exceed 5MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a photo to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    // ** Placeholder for actual upload logic **
    // 1. Create FormData
    // const formData = new FormData();
    // formData.append('photo', selectedFile);
    // formData.append('candidateId', candidateId.toString()); // Send identifier

    // 2. Send to a backend API endpoint (e.g., /api/candidate/photo)
    // try {
    //   const response = await fetch('/api/candidate/photo', {
    //     method: 'POST',
    //     body: formData,
    //     // Add headers if needed (e.g., Authorization)
    //   });
    //   if (!response.ok) throw new Error('Upload failed');
    //   const result = await response.json();
    //   setPreviewUrl(result.newPhotoUrl); // Update preview with URL from backend
    //   setSelectedFile(null); // Clear selection
    toast({
      title: "Upload Placeholder",
      description: "Photo upload backend not implemented yet.",
    });
    // } catch (error) {
    //   console.error("Upload error:", error);
    //   toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    // } finally {
    //   setIsUploading(false);
    // }

    // Simulate delay and success for now
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsUploading(false);
    // In a real scenario, you'd update the previewUrl with the actual URL from the backend response
  };

  const handleRemove = async () => {
    // ** Placeholder for actual remove logic **
    // Send request to backend API to remove photo and update candidate record
    console.log("Removing photo for candidate:", candidateId);
    setPreviewUrl(null);
    setSelectedFile(null);
    toast({
      title: "Remove Placeholder",
      description: "Photo removal backend not implemented yet.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Photo</CardTitle>
        <CardDescription>
          Upload a photo for your public profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <Avatar className="h-32 w-32 border-2 border-gray-300">
          <AvatarImage
            src={previewUrl || undefined}
            alt="Profile Photo Preview"
          />
          <AvatarFallback className="bg-gray-200">
            <ImageIcon className="h-16 w-16 text-gray-400" />
          </AvatarFallback>
        </Avatar>

        <div className="w-full space-y-2">
          <Label
            htmlFor="photo-upload"
            className={cn(
              "flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <UploadCloud className="h-5 w-5 mr-2 text-gray-500" />
            <span className="text-sm text-gray-600">
              {selectedFile ? selectedFile.name : "Choose a photo..."}
            </span>
            <Input
              id="photo-upload"
              type="file"
              className="sr-only" // Hide the default input visually
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp" // Specify accepted types
              disabled={isUploading}
            />
          </Label>

          {/* Upload/Remove Buttons */}
          <div className="flex justify-center gap-2">
            {selectedFile && (
              <Button onClick={handleUpload} disabled={isUploading} size="sm">
                {isUploading ? "Uploading..." : "Upload Photo"}
              </Button>
            )}
            {previewUrl &&
              !selectedFile && ( // Show remove only if there's an existing/uploaded photo and no new file selected
                <Button
                  onClick={handleRemove}
                  variant="destructive"
                  size="sm"
                  disabled={isUploading}
                >
                  Remove Photo
                </Button>
              )}
          </div>
        </div>

        {/* Premium Feature Placeholder */}
        {!isPremium && (
          <div className="w-full text-center p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-700 flex items-center justify-center gap-1">
              <AlertCircle className="h-4 w-4" /> Upgrade to add multiple
              photos.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
