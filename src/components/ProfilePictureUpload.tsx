import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { callEdgeFunction, authStorage } from "@/lib/auth";

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

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPEG, PNG, or WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const user = authStorage.getUser();
      if (!user) throw new Error("User not authenticated");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("action", "upload");

      const result = await callEdgeFunction("upload-profile-picture", formData);
      if (!result.success) throw new Error(result.error || "Upload failed");

      setPreviewUrl(result.url);
      onUploadSuccess(result.url);
      toast.success("Profile picture updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentImageUrl) return;

    setUploading(true);
    try {
      const user = authStorage.getUser();
      if (!user) throw new Error("User not authenticated");

      const formData = new FormData();
      formData.append("action", "delete");
      formData.append("filePath", currentImageUrl.split("/").slice(-2).join("/"));

      const result = await callEdgeFunction("upload-profile-picture", formData);
      if (!result.success) throw new Error(result.error || "Delete failed");

      setPreviewUrl(undefined);
      onUploadSuccess("");
      toast.success("Profile picture removed");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove picture");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 text-white">
      <div className="relative group">
        <Avatar
          className="
            h-32 w-32 rounded-full
            border-4 border-green-500/40 
            shadow-xl shadow-green-600/20
            hover:border-green-400 hover:shadow-green-400/30
            transition-all duration-300
          "
        >
          {previewUrl && <AvatarImage src={previewUrl} alt={userName} />}
          <AvatarFallback
            className="
              text-3xl font-bold 
              bg-gradient-to-br from-green-700 to-green-500 
              text-white
            "
          >
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>

        {previewUrl && !uploading && (
          <Button
            size="icon"
            variant="destructive"
            onClick={handleRemovePhoto}
            className="
              absolute -top-2 -right-2 h-8 w-8 rounded-full 
              opacity-0 group-hover:opacity-100 transition-all
              shadow-lg hover:shadow-red-500/40
            "
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {uploading && (
          <div
            className="
              absolute inset-0 flex items-center justify-center
              bg-black/70 rounded-full
            "
          >
            <Loader2 className="h-8 w-8 animate-spin text-green-400" />
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
        size="sm"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="
          gap-2 px-5
          bg-transparent text-green-300
          border border-green-500/40
          hover:bg-green-500/10 hover:border-green-400 hover:text-green-200
          shadow-green-500/10
          transition-all
        "
      >
        <Camera className="h-4 w-4" />
        {previewUrl ? "Change Photo" : "Upload Photo"}
      </Button>

      <p className="text-xs text-white/60 text-center">
        JPEG, PNG or WebP — Max 5MB
      </p>
    </div>
  );
}
