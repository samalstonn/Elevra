"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, Image as ImageIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  clerkUserId: string;
  currentPhotoUrl?: string | null;
  onUpload?: (url: string) => void;
}

export function PhotoUploader({
  clerkUserId,
  onUpload,
  currentPhotoUrl = null,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl);

  useEffect(() => {
    setPreviewUrl(currentPhotoUrl);
  }, [currentPhotoUrl]);

  useEffect(() => {
    // Cleanup function to revoke object URLs when component unmounts
    // or when previewUrl changes
    return () => {
      if (previewUrl && previewUrl !== currentPhotoUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, currentPhotoUrl]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      const objectUrl = URL.createObjectURL(e.target.files[0]);
      setPreviewUrl(objectUrl);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("No file selected");
      return;
    }
    setUploading(true);
    setError("");

    // Revoke the preview URL to prevent memory leaks
    if (previewUrl && previewUrl !== currentPhotoUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    try {
      // Upload file via serverless function
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/blob/upload-url", {
        method: "PUT",
        body: formData,
      });
      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(
          errData.error || `Upload failed: ${uploadRes.statusText}`
        );
      }
      const { url, key } = await uploadRes.json();

      // Persist metadata in database
      const saveRes = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, url, uploadedBy: clerkUserId }),
      });
      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        throw new Error(errData.error || `Save failed: ${saveRes.statusText}`);
      }
      const saved = await saveRes.json();
      onUpload?.(saved.url);
      toast({
        title: "Upload successful",
        description: "Your photo has been saved.",
      });
    } catch (e: unknown) {
      console.error("Photo upload error:", e);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: e instanceof Error ? e.message : String(e),
      });
      setError((e as string) || "Upload failed");
    } finally {
      setUploading(false);
      setFile(null);
      setPreviewUrl(currentPhotoUrl);
    }
  };

  return (
    <Card className={cn(error && "border-red-500")}>
      <CardHeader>
        <CardTitle>Upload Profile Photo</CardTitle>
        <CardDescription>
          Select a file to upload. This photo will be available for all
          elections.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 justify-center">
          <Avatar className="h-48 w-48">
            {previewUrl ? (
              <AvatarImage src={previewUrl} alt="Preview" />
            ) : (
              <AvatarFallback>
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        <Input
          type="file"
          accept="image/*"
          onChange={handleSelect}
          className="border-none file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {error && (
          <div className="flex items-center text-red-600 text-sm gap-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        {file && (
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2"
          >
            <UploadCloud className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload Photo"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
