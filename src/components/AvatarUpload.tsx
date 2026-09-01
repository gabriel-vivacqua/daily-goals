"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Avatar from "@/components/Avatar";

const TARGET_SIZE = 160;

/** Reads an image file, center-crops it to a square, and downscales it —
 * keeps the uploaded data URI small (a few KB) since it's stored directly
 * in the database rather than a separate object-storage bucket. */
function resizeToSquareJpeg(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't read that image"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Image editing isn't supported in this browser"));
          return;
        }
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function AvatarUpload({
  name,
  avatarUrl,
  tone = "light",
  size = 32,
  onUpdated,
}: {
  name: string;
  avatarUrl: string | null;
  tone?: "light" | "dark";
  size?: number;
  onUpdated: (avatarUrl: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file next time
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Pick an image file");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const dataUrl = await resizeToSquareJpeg(file);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: dataUrl }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Couldn't save that image");
        return;
      }
      onUpdated(data.avatarUrl);
    } catch {
      setError("Couldn't process that image");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={saving}
        title="Change your profile picture"
        className="group relative block shrink-0 rounded-full disabled:opacity-50"
      >
        <Avatar name={name} src={avatarUrl} size={size} tone={tone} />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-[9px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          {saving ? "…" : "Edit"}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {error && (
        <p className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
