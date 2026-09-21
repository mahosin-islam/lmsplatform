"use client";

import * as React from "react";
import { Camera, Check } from "lucide-react";
import { cn } from "cn";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PRESET_AVATARS: string[] = Array.from(
  { length: 12 },
  (_, index) => `https://i.pravatar.cc/300?img=${index + 1}`
);

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

export function AvatarPicker({
  open,
  onOpenChange,
  currentAvatar,
  name,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatar: string | null;
  name: string;
  onSelect: (avatar: string | null) => void;
}) {
  const [selected, setSelected] = React.useState<string | null>(currentAvatar);
  const [urlDraft, setUrlDraft] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setSelected(currentAvatar);
      setUrlDraft("");
    }
  }, [open, currentAvatar]);

  const preview = selected || urlDraft.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="size-4" />
            Choose Avatar
          </DialogTitle>
          <DialogDescription>
            Pick a preset or paste a link to your profile photo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {preview ? <AvatarImage src={preview} alt={name} /> : null}
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-semibold text-white">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium">Preview</p>
              <p className="truncate text-xs text-muted-foreground">
                {preview ? "This is how it will look" : "No avatar selected"}
              </p>
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-xs text-muted-foreground">
              Presets
            </Label>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {PRESET_AVATARS.map((avatar) => {
                const isActive = selected === avatar;
                return (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => {
                      setSelected(avatar);
                      setUrlDraft("");
                    }}
                    className={cn(
                      "relative overflow-hidden rounded-full ring-2 ring-offset-2 transition-all",
                      isActive
                        ? "ring-indigo-500"
                        : "ring-transparent hover:ring-indigo-200"
                    )}
                    aria-label="Select avatar"
                  >
                    <Avatar className="size-full aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatar}
                        alt="Avatar preset"
                        className="aspect-square size-10 object-cover"
                      />
                    </Avatar>
                    {isActive ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Check className="size-4 text-white" />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar-url" className="block">
              Or paste URL
            </Label>
            <Input
              id="avatar-url"
              type="text"
              placeholder="https://..."
              value={urlDraft}
              onChange={(event) => {
                setUrlDraft(event.target.value);
                if (event.target.value.trim()) setSelected(null);
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSelect(preview.trim() || null);
              onOpenChange(false);
            }}
            disabled={!preview}
          >
            <Check className="size-4" />
            Save Avatar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}