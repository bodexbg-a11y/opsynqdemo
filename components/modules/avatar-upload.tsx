"use client";

import { useRef, useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

/** Avatar picker with a live local preview before the form is submitted. */
export function AvatarUpload({ name, currentUrl }: { name: string; currentUrl: string | null }) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [removed, setRemoved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} size={72} src={removed ? null : preview} />

      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          name="avatar"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setRemoved(false);
            const reader = new FileReader();
            reader.onload = () => setPreview(typeof reader.result === "string" ? reader.result : null);
            reader.readAsDataURL(file);
          }}
        />
        {/* Submitted only when the user explicitly clears the photo. */}
        <input type="checkbox" name="removeAvatar" checked={removed} readOnly hidden />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 text-[12.5px] font-medium bg-white border border-ink-200 hover:bg-ink-50 text-ink-700 rounded-lg px-3 py-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload photo
          </button>
          {(preview || currentUrl) && !removed && (
            <button
              type="button"
              onClick={() => {
                setRemoved(true);
                setPreview(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-500 hover:text-danger-500 px-2 py-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>
        <p className="text-[11px] text-ink-400">PNG, JPG, WebP or GIF · up to 2 MB</p>
      </div>
    </div>
  );
}
