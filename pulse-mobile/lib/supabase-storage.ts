import { File } from 'expo-file-system';

import { supabase } from '@/lib/supabase';

export const CHECK_IN_PHOTOS_BUCKET = 'check-in-photos';

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export function buildCheckInPhotoPath(groupId: string, userId: string, checkInId: string) {
  return `${groupId}/${userId}/${checkInId}.jpg`;
}

async function readUploadBody(localUri: string) {
  if (localUri.startsWith('blob:') || localUri.startsWith('data:') || localUri.startsWith('http')) {
    const response = await fetch(localUri);
    const blob = await response.blob();

    return {
      body: blob,
      contentType: blob.type || 'image/jpeg',
    };
  }

  const file = new File(localUri);

  return {
    body: await file.bytes(),
    contentType: 'image/jpeg',
  };
}

export async function uploadCheckInPhoto(params: {
  groupId: string;
  userId: string;
  checkInId: string;
  localUri: string;
}): Promise<string> {
  const path = buildCheckInPhotoPath(params.groupId, params.userId, params.checkInId);
  const upload = await readUploadBody(params.localUri);

  const { error } = await supabase.storage.from(CHECK_IN_PHOTOS_BUCKET).upload(path, upload.body, {
    contentType: upload.contentType,
    upsert: true,
  });

  if (error) {
    throw error;
  }

  return path;
}

export async function getSignedCheckInPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  const uniquePaths = [...new Set(paths.filter(Boolean))];

  if (uniquePaths.length === 0) {
    return {};
  }

  const { data, error } = await supabase.storage
    .from(CHECK_IN_PHOTOS_BUCKET)
    .createSignedUrls(uniquePaths, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    console.warn('Failed to create signed check-in photo URLs:', error?.message);
    return {};
  }

  const urlByPath: Record<string, string> = {};
  for (const entry of data) {
    if (entry.path && entry.signedUrl) {
      urlByPath[entry.path] = entry.signedUrl;
    }
  }

  return urlByPath;
}

export async function getSignedCheckInPhotoUrl(path: string): Promise<string | null> {
  const urlByPath = await getSignedCheckInPhotoUrls([path]);
  return urlByPath[path] ?? null;
}
