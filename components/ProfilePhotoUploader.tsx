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
import Cropper, { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Utility: return a Blob containing the cropped square taken from the chosen area
const getCroppedImg = (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No 2D context"));
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Cropping failed"));
      }, "image/jpeg");
    };
    image.onerror = () => reject(new Error("Failed to load image"));
  });
};

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

  const [isCropOpen, setIsCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

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
      setIsCropOpen(true);
    }
  };

  const handleUpload = async (selectedFile: File | null = null) => {
    const uploadFile = selectedFile || file;
    if (!uploadFile) {
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
      formData.append("file", uploadFile);

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
    <>
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
                <AvatarImage
                  src={previewUrl}
                  alt="Preview"
                  className="object-cover"
                />
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
        </CardContent>
      </Card>
      {previewUrl && (
        <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crop your photo</DialogTitle>
            </DialogHeader>

            <div className="relative w-full h-64 bg-gray-200">
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                minZoom={1}
                maxZoom={4}
                zoomWithScroll
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
              />
            </div>

            <input
              type="range"
              min={1}
              max={4}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full"
            />

            <DialogFooter>
              <Button
                onClick={async () => {
                  if (!croppedAreaPixels || !previewUrl) return;
                  const blob = await getCroppedImg(previewUrl, croppedAreaPixels);
                  const newFile = new File([blob], file?.name || "avatar.jpg", {
                    type: "image/jpeg",
                  });
                  const croppedUrl = URL.createObjectURL(blob);
                  setPreviewUrl(croppedUrl);
                  await handleUpload(newFile);
                  setIsCropOpen(false);
                }}
                disabled={uploading}
                className="flex items-center gap-2"
              >
                <UploadCloud className="h-4 w-4" />
                {uploading ? "Uploading…" : "Upload Photo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
