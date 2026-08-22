import { supabase } from '@/config/supabase';
import type { APIResponse } from '@/core/types/common';
import type { Bookmark } from '../types';

export async function createBookmark(
  sessionId: string,
  pageNumber: number,
  label?: string
): Promise<APIResponse<Bookmark>> {
  const { data, error } = await supabase
    .from('session_bookmarks')
    .insert({
      session_id: sessionId,
      page_number: pageNumber,
      label: label ?? null,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message, status: 500 };
  }

  return { data, error: null, status: 201 };
}

export async function getBookmarks(
  sessionId: string
): Promise<APIResponse<Bookmark[]>> {
  const { data, error } = await supabase
    .from('session_bookmarks')
    .select('*')
    .eq('session_id', sessionId)
    .order('page_number', { ascending: true });

  if (error) {
    return { data: null, error: error.message, status: 500 };
  }

  return { data: data ?? [], error: null, status: 200 };
}

export async function deleteBookmark(
  bookmarkId: string
): Promise<APIResponse<void>> {
  const { error } = await supabase
    .from('session_bookmarks')
    .delete()
    .eq('id', bookmarkId);

  if (error) {
    return { data: null, error: error.message, status: 500 };
  }

  return { data: null, error: null, status: 200 };
}
