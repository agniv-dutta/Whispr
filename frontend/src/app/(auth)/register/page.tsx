"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Camera, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";

const COUNTRIES = [
  { code: "+91", label: "IN" },
  { code: "+1", label: "US" },
  { code: "+44", label: "UK" },
  { code: "+49", label: "DE" },
  { code: "+81", label: "JP" },
  { code: "+234", label: "NG" },
  { code: "+34", label: "ES" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [displayName, setDisplayName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fullPhone = `${countryCode}${phone}`;

  const handleSendOtp = () => {
    if (phone.length < 9) return;
    setError("");
    setStep("otp");
  };

  const handleOtpChange = (i: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[i] = value;
    setOtp(next);
    if (value && i < 5) {
      document.getElementById(`reg-otp-${i + 1}`)?.focus();
    }
  };

  const handleOtpSubmit = () => {
    if (otp.join("").length !== 6) return;
    setStep("profile");
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRegister = async () => {
    if (!displayName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/register", {
        phone: fullPhone,
        display_name: displayName.trim(),
        otp: otp.join(""),
      });
      setAuth(data.access_token, data.user);

      if (avatarFile) {
        const form = new FormData();
        form.append("avatar", avatarFile);
        try {
          await api.put("/users/me/avatar", form);
        } catch {}
      }

      router.push("/");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        setError(axiosErr.response?.data?.detail || "Registration failed");
      } else {
        setError("Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-accent">Whispr</h1>
          <p className="mt-1 text-sm text-foreground/50">Create your account</p>
        </div>

        {step === "phone" && (
          <>
            <div className="mb-6 rounded-xl bg-sidebar p-4 text-sm text-foreground/60">
              Enter your phone number to get started
            </div>

            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="rounded-xl bg-sidebar px-3 py-3 text-sm text-foreground outline-none ring-1 ring-white/10 focus:ring-accent"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label} {c.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                className="flex-1 rounded-xl bg-sidebar px-4 py-3 text-sm text-foreground outline-none ring-1 ring-white/10 focus:ring-accent placeholder:text-foreground/30"
                autoFocus
              />
            </div>

            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

            <button
              onClick={handleSendOtp}
              disabled={phone.length < 9}
              className="mt-6 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Continue
            </button>

            <p className="mt-6 text-center text-xs text-foreground/40">
              Already have an account?{" "}
              <Link href="/login" className="text-accent hover:underline">
                Login
              </Link>
            </p>
          </>
        )}

        {step === "otp" && (
          <>
            <button
              onClick={() => setStep("phone")}
              className="mb-4 flex items-center gap-1 text-sm text-foreground/50 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="mb-6 rounded-xl bg-sidebar p-4">
              <p className="text-sm text-foreground/60">Code sent to</p>
              <p className="text-sm font-medium text-foreground">{fullPhone}</p>
            </div>

            <div className="flex justify-center gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`reg-otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !digit && i > 0) {
                      document.getElementById(`reg-otp-${i - 1}`)?.focus();
                    }
                    if (e.key === "Enter") handleOtpSubmit();
                  }}
                  className="h-12 w-11 rounded-xl bg-sidebar text-center text-lg text-foreground outline-none ring-1 ring-white/10 focus:ring-accent"
                />
              ))}
            </div>

            {error && <p className="mt-3 text-center text-xs text-red-400">{error}</p>}

            <button
              onClick={handleOtpSubmit}
              disabled={otp.join("").length !== 6}
              className="mt-6 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Verify
            </button>
          </>
        )}

        {step === "profile" && (
          <>
            <button
              onClick={() => setStep("otp")}
              className="mb-4 flex items-center gap-1 text-sm text-foreground/50 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="mb-6 flex flex-col items-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-sidebar ring-2 ring-white/10 hover:ring-accent"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-foreground/30" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
              <p className="text-xs text-foreground/40">Add a profile photo (optional)</p>
            </div>

            <input
              type="text"
              placeholder="Your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              className="w-full rounded-xl bg-sidebar px-4 py-3 text-sm text-foreground outline-none ring-1 ring-white/10 focus:ring-accent placeholder:text-foreground/30"
              autoFocus
            />

            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

            <button
              onClick={handleRegister}
              disabled={!displayName.trim() || loading}
              className="mt-6 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
