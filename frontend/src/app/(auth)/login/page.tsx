"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, KeyRound, ArrowLeft } from "lucide-react";
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

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
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
      const nextInput = document.getElementById(`otp-${i + 1}`);
      nextInput?.focus();
    }
  };

  const handleSubmit = async () => {
    const otpStr = otp.join("");
    if (otpStr.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", {
        phone: fullPhone,
        otp: otpStr,
      });
      setAuth(data.access_token, data.user);
      router.push("/");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        setError(axiosErr.response?.data?.detail || "Login failed");
      } else {
        setError("Login failed");
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
          <p className="mt-1 text-sm text-foreground/50">Secure messaging</p>
        </div>

        {step === "phone" ? (
          <>
            <div className="mb-6 flex items-center gap-3 rounded-xl bg-sidebar p-4">
              <Phone className="h-5 w-5 text-accent" />
              <span className="text-sm text-foreground/60">Enter your phone number</span>
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
              No account?{" "}
              <Link href="/register" className="text-accent hover:underline">
                Register
              </Link>
            </p>
          </>
        ) : (
          <>
            <button
              onClick={() => setStep("phone")}
              className="mb-4 flex items-center gap-1 text-sm text-foreground/50 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="mb-6 flex items-center gap-3 rounded-xl bg-sidebar p-4">
              <KeyRound className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm text-foreground/60">Enter the code sent to</p>
                <p className="text-sm font-medium text-foreground">{fullPhone}</p>
              </div>
            </div>

            <div className="flex justify-center gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !digit && i > 0) {
                      const prev = document.getElementById(`otp-${i - 1}`);
                      prev?.focus();
                    }
                    if (e.key === "Enter") handleSubmit();
                  }}
                  className="h-12 w-11 rounded-xl bg-sidebar text-center text-lg text-foreground outline-none ring-1 ring-white/10 focus:ring-accent"
                />
              ))}
            </div>

            {error && <p className="mt-3 text-center text-xs text-red-400">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={otp.join("").length !== 6 || loading}
              className="mt-6 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
