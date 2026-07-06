import { supabase } from '../client';

export interface UploadProfileImageParams {
  userId: string;
  assetUri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

function getImageExtension(
  fileName: string | null | undefined,
  mimeType: string | null | undefined,
  assetUri: string,
) {
  const normalizedMimeType = mimeType?.toLowerCase();

  if (normalizedMimeType?.includes('jpeg')) return 'jpg';
  if (normalizedMimeType?.includes('png')) return 'png';
  if (normalizedMimeType?.includes('webp')) return 'webp';
  if (normalizedMimeType?.includes('heic')) return 'heic';
  if (normalizedMimeType?.includes('gif')) return 'gif';

  const source = fileName ?? assetUri;
  const match = source.match(/\.([a-z0-9]+)(?:\?.*)?$/i);

  return match?.[1]?.toLowerCase() ?? 'jpg';
}

export async function uploadProfileImage({
  userId,
  assetUri,
  fileName,
  mimeType,
}: UploadProfileImageParams): Promise<string> {
  console.log(`[uploadProfileImage] Iniciando upload para ${userId}.`);

  const response = await fetch(assetUri);

  if (!response.ok) {
    throw new Error('Nao foi possivel ler a imagem selecionada.');
  }

  const blob = await response.blob();
  const fileExtension = getImageExtension(fileName, mimeType, assetUri);
  const filePath = `${userId}/profile.${fileExtension}`;
  const contentType =
    mimeType ?? `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, blob, {
      upsert: true,
      contentType,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

  return `${data.publicUrl}?t=${Date.now()}`;
}
