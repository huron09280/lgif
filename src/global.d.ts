export {};

declare global {
  interface Window {
    electronAPI: {
      openFileDialog: () => Promise<string[] | null>;
      compressGifManual: (args: {
        inputPath: string;
        exportFormat?: 'gif' | 'webp' | 'apng';
        lossy: number;
        colors: number;
        scale?: number;
        scaleWidth?: number;
        optimizeLevel: number;
        dither: boolean;
        cropTransparency: boolean;
        frameRateDivisor: number;
        speedMultiplier: number;
        playMode?: 'normal' | 'alternate';
        clarity?: number;
        sharpness?: number;
      }) => Promise<{ outputPath: string; size: number }>;
      compressGifSmart: (args: {
        inputPath: string;
        targetSizeMB: number;
        playMode?: 'normal' | 'alternate';
      }) => Promise<{ outputPath: string; size: number; warning?: string }>;
      readGifBase64: (filePath: string) => Promise<string | null>;
      getFileStats: (filePath: string) => Promise<number>;
      getFrameCount: (filePath: string) => Promise<number>;
      openVideoOrLivePhotoDialog: () => Promise<{
        path: string;
        videoPath: string;
        isLivePhoto: boolean;
        size: number;
        duration: number;
        width: number;
        height: number;
        fps: number;
        previewBase64: string;
        previewVideoPath?: string;
      } | null>;
      parseVideoPath: (filePath: string) => Promise<{
        path: string;
        videoPath: string;
        isLivePhoto: boolean;
        size: number;
        duration: number;
        width: number;
        height: number;
        fps: number;
        previewBase64: string;
        previewVideoPath?: string;
      } | null>;
      convertVideoToGif: (args: {
        inputPath: string;
        exportFormat: 'gif' | 'webp' | 'apng' | 'livephoto';
        start: number;
        duration: number;
        scaleWidth: number;
        fps: number;
        dither: 'bayer' | 'floyd_steinberg' | 'none';
        speed: number;
        playMode?: 'normal' | 'alternate';
        clarity?: number;
        sharpness?: number;
      }) => Promise<{
        outputPath: string;
        videoPath?: string;
        size: number;
        base64: string;
        width: number;
        height: number;
        frameCount?: number;
        isLivePhoto?: boolean;
      }>;
      showItemInFolder: (filePath: string) => void;
      loadSettings: () => Promise<any>;
      saveSettings: (settings: any) => Promise<boolean>;
      getPathForFile: (file: File) => string;
      onCompressProgress: (callback: (progress: number) => void) => () => void;
    };
  }
}
