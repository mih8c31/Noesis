import { supabase } from '@/config/supabase';
import type { APIResponse } from '@/core/types/common';
import type { ReadingSession } from '../types';

export async function createReadingSession(
  documentId: string,
  userId: string
): Promise<APIResponse<ReadingSession>> {
  const { data, error } = await supabase
    .from('reading_sessions')
    .insert({
      document_id: documentId,
      user_id: userId,
      last_position: 1,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 500 };
  }

  return { data, error: null, status: 201 };
}

export async function getReadingSession(
  documentId: string,
  userId: string
): Promise<APIResponse<ReadingSession>> {
  const { data, error } = await supabase
    .from('reading_sessions')
    .select('*')
    .eq('document_id', documentId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return { data: null, error: error.message, status: 404 };
  }

  return { data, error: null, status: 200 };
}

export async function updateReadingSession(
  sessionId: string,
  updates: Partial<Pick<ReadingSession, 'last_position' | 'pages_read' | 'progress_pct' | 'duration_sec' | 'ended_at'>>
): Promise<APIResponse<ReadingSession>> {
  const { data, error } = await supabase
    .from('reading_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 500 };
  }

  return { data, error: null, status: 200 };
}
