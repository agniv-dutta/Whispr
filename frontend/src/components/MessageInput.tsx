"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Paperclip, X, Loader2 } from "lucide-react";
import api from "@/lib/api";
import type { MessageAttachment } from "@/lib/types";

interface AttachmentPreview {
  file: File;
  preview: string | null;
}

interface Props {
  onSend: (content: string, replyToId: string | null, attachment?: {
    url: string;
    file_type: string;
    file_size: number;
    file_name: string;
  }) => void;
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
  const [text, setText] = useState("");
  const [attachPreview, setAttachPreview] = useState<AttachmentPreview | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerTypingStop = useCallback(() => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      onTypingStop();
    }, 2000);
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
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [replyTo]);

  const canSend = (text.trim() || attachPreview) && !disabled && !uploading;

  return (
    <div className="border-t border-white/5 bg-background px-4 py-3">
      {replyTo && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-accent bg-sidebar px-3 py-2">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-accent">{replyTo.sender_name}</span>
            <p className="truncate text-xs text-foreground/50">{replyTo.content}</p>
          </div>
          <button onClick={onCancelReply} className="shrink-0 text-foreground/40 hover:text-foreground">
            <X size={14} />
          </button>
        </div>
      )}

      {attachPreview && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-sidebar px-3 py-2">
          {attachPreview.preview ? (
            <img src={attachPreview.preview} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-lg">
              📎
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">{attachPreview.file.name}</p>
            <p className="text-[11px] text-foreground/40">
              {(attachPreview.file.size / 1024).toFixed(0)} KB
            </p>
          </div>
          {uploading ? (
            <div className="flex items-center gap-1.5 text-xs text-accent">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {uploadProgress}%
            </div>
          ) : (
            <button onClick={clearAttach} className="shrink-0 text-foreground/40 hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="mb-1 rounded-full p-2 text-foreground/40 transition-colors hover:text-foreground disabled:opacity-40"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar"
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={attachPreview ? "Add a caption..." : "Type a message"}
            rows={1}
            className="max-h-[120px] w-full resize-none rounded-2xl bg-sidebar px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-foreground/30"
            disabled={disabled || uploading}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
