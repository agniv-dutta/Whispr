"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Paperclip, X, Loader2 } from "lucide-react";
import api from "@/lib/api";
import type { MessageAttachment } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AttachmentPreview {
  file: File;
  preview: string | null;
}

interface Props {
  onSend: (
    content: string,
    replyToId: string | null,
    attachment?: { url: string; file_type: string; file_size: number; file_name: string }
  ) => void;
  replyTo: { id: string; sender_name: string; content: string } | null;
  onCancelReply: () => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled: boolean;
}

export default function MessageInput({
  onSend,
  replyTo,
  onCancelReply,
  onTypingStart,
  onTypingStop,
  disabled,
}: Props) {
  const [text, setText]                 = useState("");
  const [attachPreview, setAttachPreview] = useState<AttachmentPreview | null>(null);
  const [uploading, setUploading]       = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerTypingStop = useCallback(() => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { onTypingStop(); }, 2000);
  }, [onTypingStop]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTypingStart();
    triggerTypingStop();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollH, 5 * 24)}px`;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large (max 10MB)");
      return;
    }
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    setAttachPreview({ file, preview });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearAttach = () => {
    if (attachPreview?.preview) URL.revokeObjectURL(attachPreview.preview);
    setAttachPreview(null);
    setUploadProgress(0);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if ((!trimmed && !attachPreview) || disabled || uploading) return;

    let attachment: MessageAttachment | null = null;

    if (attachPreview) {
      setUploading(true);
      setUploadProgress(0);
      try {
        const form = new FormData();
        form.append("file", attachPreview.file);
        const { data } = await api.post("/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
          },
        });
        attachment = data;
      } catch {
        setUploading(false);
        setUploadProgress(0);
        return;
      }
      setUploading(false);
    }

    onSend(trimmed, replyTo?.id ?? null, attachment ?? undefined);
    setText("");
    clearAttach();
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onTypingStop();
    if (typingTimer.current) clearTimeout(typingTimer.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => { if (typingTimer.current) clearTimeout(typingTimer.current); };
  }, []);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [replyTo]);

  const canSend = (text.trim() || attachPreview) && !disabled && !uploading;

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-800 bg-surface-light dark:bg-surface-dark px-4 py-3">
      {/* ── Reply preview ──────────────────────── */}
      {replyTo && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border-l-[3px] border-primary bg-primary/6 dark:bg-primary/10 px-3 py-2">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-primary">{replyTo.sender_name}</span>
            <p className="truncate text-xs text-text-secondary mt-0.5">{replyTo.content}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="shrink-0 text-text-secondary hover:text-error transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Attachment preview ─────────────────── */}
      {attachPreview && (
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 px-3 py-2">
          {attachPreview.preview ? (
            <img
              src={attachPreview.preview}
              alt=""
              className="h-12 w-12 shrink-0 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700"
            />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xl">
              📎
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-text-primary dark:text-text-invert">
              {attachPreview.file.name}
            </p>
            <p className="text-[11px] text-text-secondary mt-0.5">
              {(attachPreview.file.size / 1024).toFixed(0)} KB
            </p>
            {uploading && (
              <div className="mt-1 h-1 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
          {uploading ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {uploadProgress}%
            </div>
          ) : (
            <button
              onClick={clearAttach}
              className="shrink-0 text-text-secondary hover:text-error transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* ── Input row ──────────────────────────── */}
      <div className="flex items-center">
        <div className={cn(
          "flex-1 flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-full px-1.5 py-1.5 transition-colors",
          "border border-transparent focus-within:border-primary/30"
        )}>
          {/* Left action buttons */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className={cn(
              "flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full text-text-secondary hover:text-primary transition-colors",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          
          {/* Emoji placeholder button */}
          <button
            disabled={disabled || uploading}
            className={cn(
              "flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full text-text-secondary hover:text-primary transition-colors",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={attachPreview ? "Add a caption…" : "Type a message..."}
            rows={1}
            className={cn(
              "flex-1 max-h-[120px] resize-none bg-transparent",
              "px-3 py-2.5 text-[15px]",
              "text-text-primary dark:text-text-invert",
              "placeholder:text-text-secondary/60",
              "outline-none",
              "transition-all duration-200"
            )}
            disabled={disabled || uploading}
          />

          {/* Send button inside the pill */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-[12px] ml-1",
              "bg-primary text-white",
              "hover:bg-[#E65A1E] active:bg-[#D94E12]",
              "transition-all duration-200 shadow-sm shadow-primary/20",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            )}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
