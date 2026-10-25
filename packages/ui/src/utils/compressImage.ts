import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export async function compressImage(
  uri: string,
  originalWidth?: number,
  maxWidth = 1280
): Promise<string> {
  const context = ImageManipulator.manipulate(uri);

  // só reduz se a imagem for maior que o limite (não amplia fotos pequenas)
  if (!originalWidth || originalWidth > maxWidth) {
    context.resize({ width: maxWidth });
  }

  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  return result.uri;
}