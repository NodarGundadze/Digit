"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Send, Upload, X } from "lucide-react";
import { createTask } from "@/lib/actions/tasks";
import type { LocationDTO } from "@/lib/types";

export default function NewOutageForm({
  skillTags,
  locationPresets,
  maxImageSizeMb,
  onCreated,
}: {
  skillTags: string[];
  locationPresets: LocationDTO[];
  maxImageSizeMb: number;
  onCreated?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [price, setPrice] = useState<number | "">("");
  const [locIdx, setLocIdx] = useState(0);
  const [photo, setPhoto] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxImageSizeMb * 1024 * 1024) {
      setError(`Image must be under ${maxImageSizeMb}MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  const submit = () => {
    setError(null);
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    if (!price || Number(price) <= 0) {
      setError("Enter a proposed budget.");
      return;
    }
    start(async () => {
      const r = await createTask({
        title,
        description,
        photoUrl: photo,
        tags,
        location: locationPresets[locIdx],
        price: Number(price),
      });
      if (!r.ok) {
        setError(r.error || "Failed to submit.");
        return;
      }
      setTitle("");
      setDescription("");
      setTags([]);
      setPrice("");
      setPhoto("");
      onCreated?.();
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-5 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold text-slate-800">File a new outage</h2>
        <p className="text-sm text-slate-500">
          Describe the problem; a manager will price and broadcast it.
        </p>
      </div>

      {error && (
        <div className="text-sm bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <Labeled label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short summary of the problem"
          className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </Labeled>

      <Labeled label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Logs, symptoms, what you've tried…"
          className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </Labeled>

      <Labeled label="Skill categories (optional)">
        <p className="text-xs text-slate-400 -mt-0.5 mb-1.5">
          Pick any that apply if you know them — a manager will review and assign the right specialists.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {skillTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              className={`text-xs rounded-lg px-2.5 py-1.5 border transition-colors ${
                tags.includes(t)
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Labeled>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Labeled label="Proposed budget ($)">
          <input
            type="number"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="150"
            className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </Labeled>
        <Labeled label="Location">
          <select
            value={locIdx}
            onChange={(e) => setLocIdx(Number(e.target.value))}
            className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {locationPresets.map((l, i) => (
              <option key={i} value={i}>
                {l.address}
              </option>
            ))}
          </select>
        </Labeled>
      </div>

      <Labeled label="Diagnostic photo (optional)">
        {photo ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt="diagnostic"
              className="h-16 w-24 object-cover rounded-lg border border-slate-200"
            />
            <button
              type="button"
              onClick={() => setPhoto("")}
              className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-sm border border-dashed border-slate-300 rounded-xl px-3 py-2.5 text-slate-500 hover:bg-slate-50"
          >
            <Upload className="w-4 h-4" /> Upload screenshot
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          className="hidden"
        />
      </Labeled>

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors"
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        Submit outage
      </button>
    </div>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
