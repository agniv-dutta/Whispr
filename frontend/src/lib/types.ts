export interface UserPublic {
  id: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  last_seen: string | null;
  is_online: boolean;
}

export interface LastMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  type: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  type: "direct" | "group";
  name: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  last_message: LastMessage | null;
  unread_count: number;
  other_user: UserPublic | null;
  member_count: number;
  timer_seconds: number | null;
}

export interface MessageStatusOut {
  user_id: string;
  status: string;
  updated_at: string;
}

export interface MessageReplyPreview {
  id: string;
  content: string;
  sender_name: string;
  type: string;
  created_at: string;
}

export interface MessageAttachment {
  url: string;
  file_type: string;
  file_size: number;
  file_name: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: UserPublic;
  content: string;
  type: string;
  reply_to: MessageReplyPreview | null;
  attachment: MessageAttachment | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  statuses: MessageStatusOut[];
}

export interface MemberOut {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
  joined_at: string;
  last_seen: string | null;
  is_online: boolean;
}

export interface ConversationDetail {
  id: string;
  type: string;
  name: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  members: MemberOut[];
  member_count: number;
}
