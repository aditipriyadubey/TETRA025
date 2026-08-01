// src/lib/db.ts
//
// EduBridge AI — Session Persistence & Database Helpers
//
// Provides typed database operations for the 5 PostgreSQL tables:
//   - sessions
//   - transcripts
//   - notes
//   - vocabulary
//   - chat_history
//
// PRIVACY & PERSISTENCE RULES:
//   1. ANONYMOUS SESSIONS: No auth.users, login, or user profiles.
//      session_id (UUID v4) is the primary identity.
//   2. PERSISTENCE MODES:
//      - 'none': Default. No transcripts, notes, vocabulary, or chat history are saved to DB.
//      - 'transcript': Saves transcripts and vocabulary.
//      - 'notes': Saves transcripts, vocabulary, notes, and chat_history.
//   3. AUDIO PRIVACY: Audio is NEVER stored in PostgreSQL or Storage.

import { supabase } from "./supabaseClient";

export type PersistenceMode = "none" | "transcript" | "notes";

// ─── Table Interfaces ──────────────────────────────────────────────

export interface DbSession {
  session_id: string;
  created_at: string;
  persistence_mode: PersistenceMode;
  language: string | null;
  consent_token: string | null;
}

export interface DbTranscript {
  id: string;
  session_id: string;
  chunk_index: number;
  text: string;
  translated_text: string | null;
  created_at: string;
}

export interface DbNotes {
  session_id: string;
  content_markdown: string;
  updated_at: string;
}

export interface DbVocabulary {
  id: string;
  session_id: string;
  term: string;
  definition: string | null;
  analogy: string | null;
  translation: string | null;
  created_at: string;
}

export interface DbChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// ─── Result Types ──────────────────────────────────────────────────

export type DbResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; code?: string } };

// ═════════════════════════════════════════════════════════════════
//  1. SESSIONS
// ═════════════════════════════════════════════════════════════════

/**
 * Create a new anonymous learning session.
 * Generates a client-side UUID v4 if not provided.
 */
export async function createSession(params: {
  sessionId?: string;
  persistenceMode?: PersistenceMode;
  language?: string;
  consentToken?: string;
}): Promise<DbResult<DbSession>> {
  const sessionId = params.sessionId ?? crypto.randomUUID();
  const persistenceMode = params.persistenceMode ?? "none";

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      session_id: sessionId,
      persistence_mode: persistenceMode,
      language: params.language ?? null,
      consent_token: params.consentToken ?? null,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, error: { message: error.message, code: error.code } };
  }

  return { ok: true, data: data as DbSession };
}

/**
 * Fetch an existing session by session_id.
 */
export async function getSession(
  sessionId: string,
): Promise<DbResult<DbSession | null>> {
  const { data, error } = await supabase
    .from("sessions")
    .select()
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: { message: error.message, code: error.code } };
  }

  return { ok: true, data: data as DbSession | null };
}

/**
 * Update session attributes (e.g. changing persistence_mode or language).
 */
export async function updateSession(
  sessionId: string,
  updates: {
    persistenceMode?: PersistenceMode;
    language?: string;
  },
): Promise<DbResult<DbSession>> {
  const patch: Record<string, unknown> = {};
  if (updates.persistenceMode) patch["persistence_mode"] = updates.persistenceMode;
  if (updates.language !== undefined) patch["language"] = updates.language;


  const { data, error } = await supabase
    .from("sessions")
    .update(patch)
    .eq("session_id", sessionId)
    .select()
    .single();

  if (error) {
    return { ok: false, error: { message: error.message, code: error.code } };
  }

  return { ok: true, data: data as DbSession };
}

/**
 * Delete a session and all cascading session data (transcripts, notes, vocabulary, chat_history).
 */
export async function deleteSession(
  sessionId: string,
): Promise<DbResult<{ deleted: boolean }>> {
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("session_id", sessionId);

  if (error) {
    return { ok: false, error: { message: error.message, code: error.code } };
  }

  return { ok: true, data: { deleted: true } };
}

// ═════════════════════════════════════════════════════════════════
//  2. TRANSCRIPTS
// ═════════════════════════════════════════════════════════════════

/**
 * Save a transcript chunk if persistence_mode is 'transcript' or 'notes'.
 * Skips write gracefully if mode is 'none'.
 */
export async function saveTranscriptChunk(params: {
  sessionId: string;
  chunkIndex: number;
  text: string;
  translatedText?: string;
  mode?: PersistenceMode;
}): Promise<DbResult<DbTranscript | null>> {
  const mode = params.mode ?? "none";
  if (mode === "none") {
    // Persistence mode 'none': do not store transcript
    return { ok: true, data: null };
  }

  const { data, error } = await supabase
    .from("transcripts")
    .insert({
      session_id: params.sessionId,
      chunk_index: params.chunkIndex,
      text: params.text,
      translated_text: params.translatedText ?? null,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, error: { message: error.message, code: error.code } };
  }

  return { ok: true, data: data as DbTranscript };
}

/**
 * Fetch all transcript chunks for a session ordered by chunk_index.
 */
export async function getTranscripts(
  sessionId: string,
): Promise<DbResult<DbTranscript[]>> {
  const { data, error } = await supabase
    .from("transcripts")
    .select()
    .eq("session_id", sessionId)
    .order("chunk_index", { ascending: true });

  if (error) {
    return { ok: false, error: { message: error.message, code: error.code } };
  }

  return { ok: true, data: (data ?? []) as DbTranscript[] };
}

// ═════════════════════════════════════════════════════════════════
//  3. NOTES
// ═════════════════════════════════════════════════════════════════

/**
 * Save or update AI-generated notes for a session.
 * Skips write gracefully unless persistence_mode is 'notes'.
 */
export async function saveNotes(params: {
  sessionId: string;
  contentMarkdown: string;
  mode?: PersistenceMode;
}): Promise<DbResult<DbNotes | null>> {
  const mode = params.mode ?? "none";
  if (mode !== "notes") {
    // Only 'notes' persistence mode allows saving notes
    return { ok: true, data: null };
  }

  const { data, error } = await supabase
    .from("notes")
    .upsert({
      session_id: params.sessionId,
      content_markdown: params.contentMarkdown,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { ok: false, error: { message: error.message, code: error.code } };
  }

  return { ok: true, data: data as DbNotes };
}

/**
 * Fetch AI notes for a session.
 */
export async function getNotes(
  sessionId: string,
): Promise<DbResult<DbNotes | null>> {
  const { data, error } = await supabase
    .from("notes")
    .select()
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: { message: error.message, code: error.code } };
  }

  return { ok: true, data: data as DbNotes | null };
}

// ═════════════════════════════════════════════════════════════════
//  4. VOCABULARY
// ═════════════════════════════════════════════════════════════════

/**
 * Save a technical term if persistence_mode is 'transcript' or 'notes'.
 * Uses UNIQUE(session_id, term) upsert behavior.
 */
export async function saveVocabularyTerm(params: {
  sessionId: string;
  term: string;
  definition?: string;
  analogy?: string;
  translation?: string;
  mode?: PersistenceMode;
}): Promise<DbResult<DbVocabulary | null>> {
  const mode = params.mode ?? "none";
  if (mode === "none") {
    return { ok: true, data: null };
  }

  const { data, error } = await supabase
    .from("vocabulary")
    .upsert(
      {
        session_id: params.sessionId,
        term: params.term,
        definition: params.definition ?? null,
        analogy: params.analogy ?? null,
        translation: params.translation ?? null,
      },
      { onConflict: "session_id,term" },
    )
    .select()
    .single();

  if (error) {
    return { ok: false, error: { message: error.message, code: error.code } };
  }

  return { ok: true, data: data as DbVocabulary };
}

/**
 * Fetch all vocabulary terms for a session ordered by creation time.
 */
export async function getVocabulary(
  sessionId: string,
): Promise<DbResult<DbVocabulary[]>> {
  const { data, error } = await supabase
    .from("vocabulary")
    .select()
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    return { ok: false, error: { message: error.message, code: error.code } };
  }

  return { ok: true, data: (data ?? []) as DbVocabulary[] };
}

// ═════════════════════════════════════════════════════════════════
//  5. CHAT HISTORY
// ═════════════════════════════════════════════════════════════════

/**
 * Save a user or assistant chat message if persistence_mode is 'notes'.
 */
export async function saveChatMessage(params: {
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  mode?: PersistenceMode;
}): Promise<DbResult<DbChatMessage | null>> {
  const mode = params.mode ?? "none";
  if (mode !== "notes") {
    // Only 'notes' mode persists chat history
    return { ok: true, data: null };
  }

  const { data, error } = await supabase
    .from("chat_history")
    .insert({
      session_id: params.sessionId,
      role: params.role,
      content: params.content,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, error: { message: error.message, code: error.code } };
  }

  return { ok: true, data: data as DbChatMessage };
}

/**
 * Fetch all chat history for a session ordered by creation time.
 */
export async function getChatHistory(
  sessionId: string,
): Promise<DbResult<DbChatMessage[]>> {
  const { data, error } = await supabase
    .from("chat_history")
    .select()
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    return { ok: false, error: { message: error.message, code: error.code } };
  }

  return { ok: true, data: (data ?? []) as DbChatMessage[] };
}
