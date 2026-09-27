/** Static formats accepted by the recipe image uploader. */
export const RECIPE_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif,.heic,.heif";

const TARGET_BYTES = 500 * 1024;
const MAX_UPLOAD_BYTES = Math.floor(1.8 * 1024 * 1024);
const MAX_EDGE = 1600;
const EDGE_STEPS = [MAX_EDGE, 1280, 1024];
const QUALITY_STEPS = [0.8, 0.7, 0.6];

const IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  avif: "image/avif",
};

function imageType(file: File): string | undefined {
  if (file.type && file.type !== "application/octet-stream") {
    const type = file.type.toLowerCase();
    return type === "image/jpg" ? "image/jpeg" : type;
  }
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension ? IMAGE_TYPES[extension] : undefined;
}

export function isSupportedRecipeImage(file: File): boolean {
  const type = imageType(file);
  return Boolean(type && Object.values(IMAGE_TYPES).includes(type));
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This browser could not read the image. Try a JPEG or PNG photo."));
    };
    image.src = url;
  });
}

function encode(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob?.size) resolve(blob);
      else reject(new Error("Could not compress this image. Try another photo."));
    }, type, quality);
  });
}

function asUploadFile(blob: Blob, type: string): File {
  return new File([blob], type === "image/webp" ? "recipe.webp" : "recipe.jpg", {
    type,
  });
}

/** Resizes and encodes a photo before it reaches Supabase Storage. */
export async function optimizeRecipeImage(file: File): Promise<File> {
  const sourceType = imageType(file);
  if (!isSupportedRecipeImage(file) || !sourceType) {
    throw new Error("Choose a JPEG, PNG, WebP, HEIC, HEIF, or AVIF image.");
  }

  const canKeepOriginal = ["image/jpeg", "image/png", "image/webp"].includes(
    sourceType,
  );
  const original =
    canKeepOriginal && file.type === sourceType
      ? file
      : canKeepOriginal
        ? new File(
            [file],
            `recipe.${sourceType === "image/jpeg" ? "jpg" : sourceType.split("/")[1]}`,
            { type: sourceType },
          )
        : undefined;
  if (original && original.size <= TARGET_BYTES) return original;

  const image = await loadImage(file);
  const sourceEdge = Math.max(image.naturalWidth, image.naturalHeight);
  if (sourceEdge === 0) throw new Error("Could not read this image's dimensions.");

  let best: Blob | undefined;
  let bestType = "image/webp";
  let outputType = "image/webp";
  const edges = [...new Set(EDGE_STEPS.map((edge) => Math.min(edge, sourceEdge)))];

  for (const edge of edges) {
    const scale = edge / sourceEdge;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not process the image.");
    if (outputType === "image/jpeg") {
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of QUALITY_STEPS) {
      let blob = await encode(canvas, outputType, quality);
      if (outputType === "image/webp" && blob.type !== outputType) {
        outputType = "image/jpeg";
        context.globalCompositeOperation = "destination-over";
        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        blob = await encode(canvas, outputType, quality);
      }
      if (blob.type !== outputType) {
        throw new Error("This browser could not encode the image.");
      }
      if (!best || blob.size < best.size) {
        best = blob;
        bestType = outputType;
      }
      if (blob.size <= TARGET_BYTES) return asUploadFile(blob, outputType);
    }
  }

  if (best && best.size <= MAX_UPLOAD_BYTES) {
    return asUploadFile(best, bestType);
  }
  throw new Error("This image could not fit the 2 MB upload limit. Choose a smaller photo.");
}
