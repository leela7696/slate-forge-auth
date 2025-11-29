import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { callEdgeFunction } from "@/lib/auth";
import { authStorage } from "@/lib/auth";

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

    setUploading(true);

    try {
      const user = authStorage.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'upload');

      // Call edge function to handle upload
      const result = await callEdgeFunction('upload-profile-picture', formData);

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      const publicUrl = result.url;

      // Update preview
      setPreviewUrl(publicUrl);

      // Call success callback
      onUploadSuccess(publicUrl);

      toast.success("Profile picture updated successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload profile picture");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
    </div>
  );
}
