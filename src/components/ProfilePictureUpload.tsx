import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { callEdgeFunction } from "@/lib/auth";
import { authStorage } from "@/lib/auth";
import Cropper from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  userName: string;
  onUploadSuccess: (url: string) => void;
}

export function ProfilePictureUpload({
  currentImageUrl,
  userName,
  onUploadSuccess,
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropper modal state
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, or WebP)");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }
    // Do not upload instantly; open cropper modal
    const objectUrl = URL.createObjectURL(file);
    setSelectedImageUrl(objectUrl);
    setIsCropOpen(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentImageUrl) return;

    setUploading(true);
    try {
      const user = authStorage.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get file path from URL
      const filePath = currentImageUrl.split("/").slice(-2).join("/");

      // Create FormData for delete action
      const formData = new FormData();
      formData.append('action', 'delete');
      formData.append('filePath', filePath);

      // Call edge function to handle deletion
      const result = await callEdgeFunction('upload-profile-picture', formData);

      if (!result.success) {
        throw new Error(result.error || 'Delete failed');
      }

      // Clear preview
      setPreviewUrl(undefined);

      // Call success callback with empty string
      onUploadSuccess("");

      toast.success("Profile picture removed");
    } catch (error: any) {
      console.error("Remove error:", error);
      toast.error(error.message || "Failed to remove profile picture");
    } finally {
      setUploading(false);
    }
  };

  const onCropComplete = (_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const getCroppedImageBlob = async (
    imageSrc: string,
    cropPixels: { width: number; height: number; x: number; y: number },
    rotationDeg: number
  ): Promise<Blob> => {
    const image: HTMLImageElement = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = imageSrc;
    });

    const canvas = document.createElement("canvas");

    // Compute target size with max 1024 x 1024 while keeping square output
    const size = Math.min(1024, Math.max(cropPixels.width, cropPixels.height));
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    // Apply rotation if any
    if (rotationDeg) {
      ctx.translate(size / 2, size / 2);
      ctx.rotate((rotationDeg * Math.PI) / 180);
      ctx.translate(-size / 2, -size / 2);
    }

    // Draw the cropped region scaled to canvas
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      image,
      cropPixels.x,
      cropPixels.y,
      cropPixels.width,
      cropPixels.height,
      0,
      0,
      size,
      size
    );

    // Prefer WebP for smaller size
    const blob: Blob = await new Promise((resolve) => {
      canvas.toBlob(
        (b) => resolve(b as Blob),
        "image/webp",
        0.85 // compression quality
      );
    });

    return blob;
  };

  const handleCancelCrop = () => {
    if (selectedImageUrl) URL.revokeObjectURL(selectedImageUrl);
    setSelectedImageUrl(null);
    setIsCropOpen(false);
    setCroppedAreaPixels(null);
  };

  const handleSaveCropped = async () => {
    if (!selectedImageUrl || !croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImageBlob(selectedImageUrl, croppedAreaPixels, rotation);
      const file = new File([blob], "avatar.webp", { type: "image/webp" });

      const user = authStorage.getUser();
      if (!user) throw new Error("User not authenticated");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("action", "upload");

      const result = await callEdgeFunction("upload-profile-picture", formData);
      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      const publicUrl = result.url;
      setPreviewUrl(publicUrl);
      onUploadSuccess(publicUrl);
      toast.success("Profile photo updated successfully");
      setIsCropOpen(false);
      if (selectedImageUrl) URL.revokeObjectURL(selectedImageUrl);
      setSelectedImageUrl(null);
    } catch (error: any) {
      console.error("Crop/Upload error:", error);
      toast.error(error.message || "Failed to process and upload photo");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-xl">
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt={userName} />
          ) : null}
          <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>

        {previewUrl && !uploading && (
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            onClick={handleRemovePhoto}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="gap-2"
      >
        <Camera className="h-4 w-4" />
        {previewUrl ? "Change Photo" : "Upload Photo"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        JPEG, PNG or WebP. Max 5MB
      </p>

      {/* Cropper Modal */}
      <Dialog open={isCropOpen} onOpenChange={(open) => (open ? setIsCropOpen(true) : handleCancelCrop())}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adjust Your Profile Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative w-full h-64 bg-muted rounded-md overflow-hidden">
              {selectedImageUrl && (
                <Cropper
                  image={selectedImageUrl}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  cropShape="round"
                  onCropChange={setCrop}
                  onZoomChange={(z) => setZoom(Array.isArray(z) ? z[0] : z)}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Zoom</span>
                <span className="text-sm">{zoom.toFixed(2)}x</span>
              </div>
              <Slider
                value={[zoom]}
                min={1}
                max={4}
                step={0.05}
                onValueChange={(vals) => setZoom(vals[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rotate</span>
                <span className="text-sm">{rotation}°</span>
              </div>
              <Slider
                value={[rotation]}
                min={-180}
                max={180}
                step={1}
                onValueChange={(vals) => setRotation(vals[0])}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelCrop} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleSaveCropped} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
