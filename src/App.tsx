import { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Chip, IconButton, alpha } from '@mui/material';
import { CloudUpload, SaveAlt, DeleteOutlined, CropOriginal, CheckCircleOutlined, Menu, FolderOpen, Close, ClearAll } from '@mui/icons-material';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import VideoRightPanel from './components/VideoRightPanel';
import ImageSlider from './components/ImageSlider';

// FileState interface for GIF Compression
interface FileState {
  path: string;
  size: number;
  base64: string | null;
  width?: number;
  height?: number;
  frameCount?: number;
}

// BatchFile interface for Batch GIF Compression
interface BatchFile {
  id: string;
  path: string;
  name: string;
  originalSize: number;
  compressedSize?: number;
  width?: number;
  height?: number;
  frameCount?: number;
  status: 'pending' | 'compressing' | 'completed' | 'failed';
  ratio?: number;
  error?: string;
  outputPath?: string;
  base64?: string | null;
}

// VideoFileState interface for Video to GIF
interface VideoFileState {
  path: string;
  videoPath: string;
  isLivePhoto: boolean;
  size: number;
  duration: number;
  width: number;
  height: number;
  fps: number;
  previewBase64: string;
}

// ConvertedVideoState interface
interface ConvertedVideoState {
  outputPath: string;
  videoPath?: string;
  size: number;
  base64: string;
  width: number;
  height: number;
  frameCount?: number;
  isLivePhoto?: boolean;
}

const getImageDimensions = (base64: string): Promise<{ width: number, height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = base64;
  });
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'compress' | 'videoToGif'>('compress');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // Tab 1: GIF Compression States & Handlers
  // ==========================================
  const [originalFile, setOriginalFile] = useState<FileState | null>(null);
  const [compressedFile, setCompressedFile] = useState<FileState | null>(null);
  
  // Batch processing state
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
  const [isBatchCompressing, setIsBatchCompressing] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [gifExportFormat, setGifExportFormat] = useState<'gif' | 'webp' | 'apng'>('gif');

  const [targetMB, setTargetMB] = useState<number>(() => {
    const saved = localStorage.getItem('gif_targetMB');
    return saved !== null ? parseFloat(saved) : 5.0;
  });
  const [lossy, setLossy] = useState<number>(() => {
    const saved = localStorage.getItem('gif_lossy');
    return saved !== null ? parseInt(saved, 10) : 30;
  });
  const [colors, setColors] = useState<number>(() => {
    const saved = localStorage.getItem('gif_colors');
    return saved !== null ? parseInt(saved, 10) : 128;
  });
  const [compressScaleWidth, setCompressScaleWidth] = useState<number>(() => {
    const saved = localStorage.getItem('gif_compressScaleWidth');
    return saved !== null ? parseInt(saved, 10) : -1;
  });
  const [optimizeLevel, setOptimizeLevel] = useState<number>(() => {
    const saved = localStorage.getItem('gif_optimizeLevel');
    return saved !== null ? parseInt(saved, 10) : 3;
  });
  const [dither, setDither] = useState<boolean>(() => {
    const saved = localStorage.getItem('gif_dither');
    return saved !== null ? saved === 'true' : true;
  });
  const [cropTransparency, setCropTransparency] = useState<boolean>(() => {
    const saved = localStorage.getItem('gif_cropTransparency');
    return saved !== null ? saved === 'true' : false;
  });
  const [frameRateDivisor, setFrameRateDivisor] = useState<number>(() => {
    const saved = localStorage.getItem('gif_frameRateDivisor');
    return saved !== null ? parseInt(saved, 10) : 1;
  });
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(() => {
    const saved = localStorage.getItem('gif_speedMultiplier');
    return saved !== null ? parseFloat(saved) : 1.0;
  });

  // ==========================================
  // Tab 2: Video & Live Photo States (Required for settings sync context)
  // ==========================================
  const [exportFormat, setExportFormat] = useState<'gif' | 'webp' | 'apng' | 'livephoto'>('gif');
  const [fps, setFps] = useState<number>(15);
  const [videoDither, setVideoDither] = useState<'bayer' | 'floyd_steinberg' | 'none'>('floyd_steinberg');
  const [speed, setSpeed] = useState<number>(1.0);

  // Load settings on mount from backend configuration file
  useEffect(() => {
    const initSettings = async () => {
      try {
        const saved = await window.electronAPI.loadSettings();
        if (saved) {
          if (saved.targetMB !== undefined) setTargetMB(saved.targetMB);
          if (saved.lossy !== undefined) setLossy(saved.lossy);
          if (saved.colors !== undefined) setColors(saved.colors);
          if (saved.compressScaleWidth !== undefined) setCompressScaleWidth(saved.compressScaleWidth);
          if (saved.optimizeLevel !== undefined) setOptimizeLevel(saved.optimizeLevel);
          if (saved.dither !== undefined) setDither(saved.dither);
          if (saved.cropTransparency !== undefined) setCropTransparency(saved.cropTransparency);
          if (saved.frameRateDivisor !== undefined) setFrameRateDivisor(saved.frameRateDivisor);
          if (saved.speedMultiplier !== undefined) setSpeedMultiplier(saved.speedMultiplier);
          
          if (saved.exportFormat !== undefined) setExportFormat(saved.exportFormat);
          if (saved.fps !== undefined) setFps(saved.fps);
          if (saved.videoDither !== undefined) setVideoDither(saved.videoDither);
          if (saved.speed !== undefined) setSpeed(saved.speed);
          if (saved.gifExportFormat !== undefined) setGifExportFormat(saved.gifExportFormat);
        }
      } catch (err) {
        console.error('Failed to load settings from main process:', err);
      } finally {
        setSettingsLoaded(true);
      }
    };
    initSettings();
  }, []);

  // Save settings on update
  useEffect(() => {
    if (!settingsLoaded) return;
    const settings = {
      targetMB,
      lossy,
      colors,
      compressScaleWidth,
      optimizeLevel,
      dither,
      cropTransparency,
      frameRateDivisor,
      speedMultiplier,
      exportFormat,
      fps,
      videoDither,
      speed,
      gifExportFormat
    };
    
    // Backup to localStorage
    localStorage.setItem('gif_targetMB', String(targetMB));
    localStorage.setItem('gif_lossy', String(lossy));
    localStorage.setItem('gif_colors', String(colors));
    localStorage.setItem('gif_compressScaleWidth', String(compressScaleWidth));
    localStorage.setItem('gif_optimizeLevel', String(optimizeLevel));
    localStorage.setItem('gif_dither', String(dither));
    localStorage.setItem('gif_cropTransparency', String(cropTransparency));
    localStorage.setItem('gif_frameRateDivisor', String(frameRateDivisor));
    localStorage.setItem('gif_speedMultiplier', String(speedMultiplier));

    window.electronAPI.saveSettings(settings).catch((err) => {
      console.error('Failed to save settings:', err);
    });
  }, [
    settingsLoaded,
    targetMB,
    lossy,
    colors,
    compressScaleWidth,
    optimizeLevel,
    dither,
    cropTransparency,
    frameRateDivisor,
    speedMultiplier,
    exportFormat,
    fps,
    videoDither,
    speed,
    gifExportFormat
  ]);

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleAddFiles = async (filePaths: string[]) => {
    setLoading(true);
    try {
      // 1. If only 1 file is selected, and we have no files in batch list, use single-file comparison mode
      if (filePaths.length === 1 && batchFiles.length === 0) {
        const filePath = filePaths[0];
        const size = await window.electronAPI.getFileStats(filePath);
        const base64 = await window.electronAPI.readGifBase64(filePath);
        const frameCount = await window.electronAPI.getFrameCount(filePath);
        let width = 0, height = 0;
        if (base64) {
          const dims = await getImageDimensions(base64);
          width = dims.width;
          height = dims.height;
        }
        setOriginalFile({ path: filePath, size, base64, width, height, frameCount });
        
        // Apply saved scaleWidth capped at the new image's width to avoid upscaling
        const savedWidth = parseInt(localStorage.getItem('gif_compressScaleWidth') || '-1', 10);
        if (savedWidth > 0) {
          setCompressScaleWidth(Math.min(savedWidth, width));
        } else {
          setCompressScaleWidth(width);
        }
        setCompressedFile(null);
        return;
      }

      // 2. If we have a single file loaded, and we add more files, convert it into the batch queue first
      let baseBatch: BatchFile[] = [...batchFiles];
      if (originalFile && batchFiles.length === 0) {
        baseBatch = [{
          id: originalFile.path + '_' + Date.now(),
          path: originalFile.path,
          name: originalFile.path.split('/').pop() || 'image.gif',
          originalSize: originalFile.size,
          width: originalFile.width,
          height: originalFile.height,
          frameCount: originalFile.frameCount,
          status: 'pending',
          base64: originalFile.base64
        }];
        setOriginalFile(null);
        setCompressedFile(null);
      }

      // Add new files to batch list
      const newBatchFiles: BatchFile[] = [];
      for (const filePath of filePaths) {
        // Prevent duplicates
        if (baseBatch.some(f => f.path === filePath)) continue;
        
        const size = await window.electronAPI.getFileStats(filePath);
        const name = filePath.split('/').pop() || 'image.gif';
        
        newBatchFiles.push({
          id: filePath + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          path: filePath,
          name,
          originalSize: size,
          status: 'pending'
        });
      }
      
      const updatedBatch = [...baseBatch, ...newBatchFiles];
      setBatchFiles(updatedBatch);

      // Asynchronously fetch details (base64, frameCount, dims) for newly added batch items
      for (const newFile of newBatchFiles) {
        (async () => {
          try {
            const base64 = await window.electronAPI.readGifBase64(newFile.path);
            const frameCount = await window.electronAPI.getFrameCount(newFile.path);
            let width = 0, height = 0;
            if (base64) {
              const dims = await getImageDimensions(base64);
              width = dims.width;
              height = dims.height;
            }
            setBatchFiles(prev => prev.map(f => {
              if (f.id === newFile.id) {
                return { ...f, base64, frameCount, width, height };
              }
              return f;
            }));
          } catch (err) {
            console.error('Failed to load metadata for batch file:', newFile.path, err);
          }
        })();
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = async () => {
    const filePaths = await window.electronAPI.openFileDialog();
    if (filePaths && filePaths.length > 0) {
      await handleAddFiles(filePaths);
    }
  };

  const handleRemove = () => {
    setOriginalFile(null);
    setCompressedFile(null);
  };

  const handleRemoveBatchItem = (id: string) => {
    setBatchFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClearBatch = () => {
    setBatchFiles([]);
    setOriginalFile(null);
    setCompressedFile(null);
  };

  const handleBatchCompress = async (mode: 'smart' | 'manual') => {
    if (batchFiles.length === 0 || isBatchCompressing) return;
    setIsBatchCompressing(true);
    setLoading(true);

    // Reset status of non-completed files
    setBatchFiles(prev => prev.map(f => f.status !== 'completed' ? { ...f, status: 'pending', error: undefined } : f));

    const queue = [...batchFiles];
    const concurrency = 3;
    let index = 0;

    const runNext = async (): Promise<void> => {
      if (index >= queue.length) return;
      const fileIndex = index++;
      const file = queue[fileIndex];

      // Skip already completed files to avoid wasting time
      if (file.status === 'completed') {
        return runNext();
      }

      setBatchFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'compressing' } : f));

      try {
        let res;
        if (mode === 'smart') {
          res = await window.electronAPI.compressGifSmart({
            inputPath: file.path,
            targetSizeMB: targetMB
          });
        } else {
          // Cap scaleWidth to avoid upscaling
          let fileScaleWidth = compressScaleWidth;
          if (fileScaleWidth > 0 && file.width && file.width < fileScaleWidth) {
            fileScaleWidth = file.width;
          }
          res = await window.electronAPI.compressGifManual({
            inputPath: file.path,
            exportFormat: gifExportFormat,
            lossy,
            colors,
            scaleWidth: fileScaleWidth,
            optimizeLevel,
            dither,
            cropTransparency,
            frameRateDivisor,
            speedMultiplier
          });
        }

        const size = res.size;
        const ratio = (1 - size / file.originalSize) * 100;
        const compressedBase64 = await window.electronAPI.readGifBase64(res.outputPath);

        setBatchFiles(prev => prev.map(f => f.id === file.id ? {
          ...f,
          status: 'completed',
          compressedSize: size,
          ratio,
          outputPath: res.outputPath,
          base64: compressedBase64 || f.base64
        } : f));
      } catch (err: any) {
        console.error('Failed to compress', file.path, err);
        setBatchFiles(prev => prev.map(f => f.id === file.id ? {
          ...f,
          status: 'failed',
          error: err.message || '压缩失败'
        } : f));
      }

      return runNext();
    };

    const promises: Promise<void>[] = [];
    for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
      promises.push(runNext());
    }

    await Promise.all(promises);
    setIsBatchCompressing(false);
    setLoading(false);
  };

  const handleManualCompress = async () => {
    if (!originalFile) return;
    setLoading(true);
    try {
      const res = await window.electronAPI.compressGifManual({
        inputPath: originalFile.path,
        exportFormat: gifExportFormat,
        lossy,
        colors,
        scaleWidth: compressScaleWidth,
        optimizeLevel,
        dither,
        cropTransparency,
        frameRateDivisor,
        speedMultiplier
      });
      const base64 = await window.electronAPI.readGifBase64(res.outputPath);
      const frameCount = await window.electronAPI.getFrameCount(res.outputPath);
      let width = 0, height = 0;
      if (base64) {
        const dims = await getImageDimensions(base64);
        width = dims.width;
        height = dims.height;
      }
      setCompressedFile({ path: res.outputPath, size: res.size, base64, width, height, frameCount });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSmartCompress = async () => {
    if (!originalFile) return;
    setLoading(true);
    try {
      const res = await window.electronAPI.compressGifSmart({
        inputPath: originalFile.path,
        targetSizeMB: targetMB,
      });
      const base64 = await window.electronAPI.readGifBase64(res.outputPath);
      const frameCount = await window.electronAPI.getFrameCount(res.outputPath);
      let width = 0, height = 0;
      if (base64) {
        const dims = await getImageDimensions(base64);
        width = dims.width;
        height = dims.height;
      }
      setCompressedFile({ path: res.outputPath, size: res.size, base64, width, height, frameCount });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Tab 2: Video & Live Photo States & Handlers
  // ==========================================
  const [videoOriginalFile, setVideoOriginalFile] = useState<VideoFileState | null>(null);
  const [videoConvertedFile, setVideoConvertedFile] = useState<ConvertedVideoState | null>(null);

  const [timeRange, setTimeRange] = useState<[number, number]>([0, 5]);
  const [scaleWidth, setScaleWidth] = useState<number>(-1);

  const handleSelectVideoFile = async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.openVideoOrLivePhotoDialog();
      if (res) {
        setVideoOriginalFile(res);
        setTimeRange([0, Math.min(res.duration, 5)]);
        setScaleWidth(res.width);
        setVideoConvertedFile(null);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || '选择文件或解析失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVideo = () => {
    setVideoOriginalFile(null);
    setVideoConvertedFile(null);
  };

  const handleVideoConvert = async () => {
    if (!videoOriginalFile) return;
    setLoading(true);
    try {
      const res = await window.electronAPI.convertVideoToGif({
        inputPath: videoOriginalFile.videoPath,
        exportFormat,
        start: timeRange[0],
        duration: timeRange[1] - timeRange[0],
        scaleWidth: ['gif', 'webp', 'apng'].includes(exportFormat) ? scaleWidth : -1,
        fps,
        dither: videoDither,
        speed
      });
      setVideoConvertedFile(res);
    } catch (err: any) {
      console.error(err);
      alert(err.message || '转换失败');
    } finally {
      setLoading(false);
    }
  };

  const getCompanionBaseName = (fullPath: string) => {
    const parts = fullPath.split('/');
    return parts[parts.length - 1];
  };

  const handleImportToCompress = () => {
    if (!videoConvertedFile || videoConvertedFile.isLivePhoto) return;
    setOriginalFile({
      path: videoConvertedFile.outputPath,
      size: videoConvertedFile.size,
      base64: videoConvertedFile.base64,
      width: videoConvertedFile.width,
      height: videoConvertedFile.height,
      frameCount: videoConvertedFile.frameCount
    });
    setCompressedFile(null);
    setActiveTab('compress');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const filePaths = files.map(f => {
      try {
        return window.electronAPI.getPathForFile(f);
      } catch (err) {
        console.error('Failed to get path for file using webUtils:', err);
        return (f as any).path;
      }
    }).filter(Boolean);
    if (filePaths.length === 0) return;

    if (activeTab === 'compress') {
      const allowedExts = ['.gif', '.webp', '.png', '.apng'];
      const gifPaths = filePaths.filter(p => 
        allowedExts.some(ext => p.toLowerCase().endsWith(ext))
      );
      
      if (gifPaths.length > 0) {
        await handleAddFiles(gifPaths);
      }
    } else if (activeTab === 'videoToGif') {
      const allowedExts = ['.mp4', '.mov', '.webm', '.avi', '.heic', '.heif', '.jpg', '.jpeg', '.png'];
      const firstValidFile = filePaths.find(p =>
        allowedExts.some(ext => p.toLowerCase().endsWith(ext))
      );
      if (firstValidFile) {
        setLoading(true);
        try {
          const res = await window.electronAPI.parseVideoPath(firstValidFile);
          if (res) {
            setVideoOriginalFile(res);
            setTimeRange([0, Math.min(res.duration, 5)]);
            setScaleWidth(res.width);
            setVideoConvertedFile(null);
          }
        } catch (err: any) {
          console.error(err);
          alert(err.message || '选择文件或解析失败');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const getBatchStats = () => {
    let totalOriginal = 0;
    let totalCompressed = 0;
    let completedCount = 0;
    
    for (const f of batchFiles) {
      totalOriginal += f.originalSize;
      if (f.status === 'completed' && f.compressedSize) {
        totalCompressed += f.compressedSize;
        completedCount++;
      } else {
        totalCompressed += f.originalSize;
      }
    }
    
    const saved = totalOriginal - totalCompressed;
    const ratio = totalOriginal > 0 ? (saved / totalOriginal) * 100 : 0;
    
    return {
      totalOriginal,
      totalCompressed,
      saved,
      ratio,
      completedCount
    };
  };

  const batchStats = getBatchStats();

  const getExportTypeLabel = () => {
    if (!videoConvertedFile) return '--';
    if (videoConvertedFile.isLivePhoto) return 'Live Photo';
    const ext = videoConvertedFile.outputPath.split('.').pop()?.toLowerCase();
    if (ext === 'webp') return 'WebP 动图';
    if (ext === 'png' || ext === 'apng') return 'APNG 动图';
    return 'GIF 动图';
  };

  const getExportTypeSubtitle = () => {
    if (!videoConvertedFile) return '--';
    if (videoConvertedFile.isLivePhoto) return 'JPG + MOV 配对文件';
    return `${videoConvertedFile.frameCount} 帧`;
  };

  return (
    <Box 
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: 'background.default' }}
    >
      {/* Collapsible Sidebar Wrapper */}
      <Box sx={{
        width: isSidebarOpen ? 260 : 0,
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease',
        overflow: 'hidden',
        flexShrink: 0,
        height: '100%',
        borderRight: '1px solid',
        borderColor: isSidebarOpen ? 'divider' : 'transparent'
      }}>
        <Box sx={{ width: 260 }}>
          <Sidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
        </Box>
      </Box>
      
      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Title bar drag area */}
        <Box style={{ WebkitAppRegion: 'drag' } as any} sx={{ height: 40 }} />
        
        {activeTab === 'compress' ? (
          // ==========================================
          // Tab 1: GIF Compression View
          // ==========================================
          <Box sx={{ flex: 1, px: 4, pb: 4, display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  size="small"
                  sx={{ mr: 0.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', color: 'text.secondary' }}
                >
                  <Menu fontSize="small" />
                </IconButton>
                <CropOriginal sx={{ color: 'text.secondary' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {batchFiles.length > 0 ? '批量优化查看器' : '对比查看器'}
                </Typography>
              </Box>
              {(originalFile || batchFiles.length > 0) && (
                <Button 
                  variant="outlined" 
                  startIcon={<DeleteOutlined />} 
                  onClick={batchFiles.length > 0 ? handleClearBatch : handleRemove}
                  size="small"
                  disabled={loading || isBatchCompressing}
                  sx={{ borderRadius: 6, borderColor: 'divider', color: 'text.primary' }}
                >
                  移除全部文件
                </Button>
              )}
            </Box>

            {/* Main Display Area */}
            <Paper sx={{ 
              flex: 1, 
              minHeight: 360,
              display: 'flex', 
              flexDirection: 'column', 
              bgcolor: 'background.paper',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 2
            }}>
              {batchFiles.length > 0 ? (
                // ==========================================
                // Batch processing list view
                // ==========================================
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* List Header */}
                  <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        批量压缩队列
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        已加载 {batchFiles.length} 个文件 · 支持继续拖入更多 GIF
                      </Typography>
                    </Box>
                    <Button 
                      variant="outlined" 
                      color="inherit" 
                      startIcon={<ClearAll />} 
                      onClick={handleClearBatch}
                      disabled={isBatchCompressing}
                      size="small"
                      sx={{ borderRadius: 6, borderColor: 'divider' }}
                    >
                      清空列表
                    </Button>
                  </Box>

                  {/* List of files */}
                  <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {batchFiles.map((file) => {
                      const isPending = file.status === 'pending';
                      const isCompressing = file.status === 'compressing';
                      const isCompleted = file.status === 'completed';
                      const isFailed = file.status === 'failed';

                      return (
                        <Paper 
                          key={file.id} 
                          variant="outlined" 
                          sx={{ 
                            p: 1.5, 
                            borderRadius: 2, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            borderColor: isCompressing ? 'primary.main' : 'divider',
                            bgcolor: isCompressing ? (theme) => alpha(theme.palette.primary.main, 0.02) : 'background.paper',
                            boxShadow: isCompressing ? '0 4px 20px -5px rgba(0,0,0,0.15)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* Left: Thumbnail & Info */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
                            <Box sx={{ 
                              width: 48, 
                              height: 48, 
                              borderRadius: 1.5, 
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0a0a0c' : '#F3F4F6', 
                              backgroundImage: file.base64 ? `url(${file.base64})` : 'none', 
                              backgroundSize: 'contain', 
                              backgroundPosition: 'center', 
                              backgroundRepeat: 'no-repeat', 
                              flexShrink: 0, 
                              overflow: 'hidden', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              border: '1px solid',
                              borderColor: 'divider'
                            }}>
                              {!file.base64 && <CircularProgress size={16} />}
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {file.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                                <span>{formatSize(file.originalSize)}</span>
                                {file.width && (
                                  <>
                                    <span>·</span>
                                    <span>{file.width}x{file.height} · {file.frameCount}帧</span>
                                  </>
                                )}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Middle: Progress / Status */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, flexShrink: 0 }}>
                            {isPending && (
                              <Chip label="等待中" size="small" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
                            )}
                            {isCompressing && (
                              <Chip 
                                icon={<CircularProgress size={12} color="inherit" />} 
                                label="正在优化..." 
                                size="small" 
                                color="primary" 
                                sx={{ height: 22, fontSize: 11 }} 
                              />
                            )}
                            {isCompleted && (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                                  {formatSize(file.compressedSize || 0)}
                                </Typography>
                                <Typography variant="caption" color="success.main" sx={{ fontWeight: 'medium' }}>
                                  已节省 -{file.ratio?.toFixed(0)}%
                                </Typography>
                              </Box>
                            )}
                            {isFailed && (
                              <Chip label="失败" size="small" color="error" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
                            )}
                          </Box>

                          {/* Right: Actions */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                            {isCompleted && file.outputPath && (
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => window.electronAPI.showItemInFolder(file.outputPath!)}
                                title="定位文件"
                                sx={{ borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}
                              >
                                <FolderOpen fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton 
                              size="small" 
                              onClick={() => handleRemoveBatchItem(file.id)}
                              disabled={isBatchCompressing}
                              color="error"
                              title="移除"
                              sx={{ borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}
                            >
                              <Close fontSize="small" />
                            </IconButton>
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>

                  {/* Batch Progress Status Bottom */}
                  {isBatchCompressing && (
                    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        批量处理中：已完成 {batchFiles.filter(f => f.status === 'completed' || f.status === 'failed').length} / {batchFiles.length}
                      </Typography>
                      <CircularProgress size={16} />
                    </Box>
                  )}
                </Box>
              ) : !originalFile ? (
                // ==========================================
                // Empty upload view
                // ==========================================
                <Box 
                  sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed', borderColor: 'divider', m: 2, borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={handleSelectFile}
                >
                  <CloudUpload sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>点击或拖拽一个或多个 GIF 文件到此处</Typography>
                  <Typography variant="caption" color="text.secondary">支持批量选择或拖入多个文件</Typography>
                </Box>
              ) : (
                // ==========================================
                // Single file comparison view
                // ==========================================
                <Box sx={{ flex: 1, p: 2 }}>
                  {!compressedFile ? (
                    <Box 
                      component="img"
                      src={originalFile.base64!} 
                      sx={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain', 
                        borderRadius: 2, 
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0a0a0c' : '#F3F4F6' 
                      }} 
                    />
                  ) : (
                    <ImageSlider 
                      key={`${compressedFile.path}_${compressedFile.size}`}
                      originalSrc={originalFile.base64!} 
                      compressedSrc={compressedFile.base64!} 
                    />
                  )}
                </Box>
              )}
              
              {loading && !isBatchCompressing && (
                <Box sx={{ position: 'absolute', inset: 0, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(20,20,25,0.8)' : 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <CircularProgress size={60} thickness={4} />
                </Box>
              )}
            </Paper>

            {/* Stats Area */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Paper sx={{ flex: 1, p: 2.5, bgcolor: 'background.paper', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  {batchFiles.length > 0 ? '原始总大小' : '原始大小'}
                </Typography>
                <Typography variant="h5" sx={{ mt: 1, mb: 0.5, fontWeight: 'bold' }}>
                  {batchFiles.length > 0 ? formatSize(batchStats.totalOriginal) : (originalFile ? formatSize(originalFile.size) : '--')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {batchFiles.length > 0 ? `共 ${batchFiles.length} 个文件` : (originalFile ? `${originalFile.width}x${originalFile.height} · ${originalFile.frameCount}帧` : '--')}
                </Typography>
              </Paper>
              <Paper sx={{ flex: 1, p: 2.5, bgcolor: 'background.paper', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  {batchFiles.length > 0 ? '优化后总大小' : '压缩后大小'}
                </Typography>
                <Typography variant="h5" sx={{ mt: 1, mb: 0.5, fontWeight: 'bold' }}>
                  {batchFiles.length > 0 ? formatSize(batchStats.totalCompressed) : (compressedFile ? formatSize(compressedFile.size) : '--')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {batchFiles.length > 0 ? `已完成 ${batchStats.completedCount} / ${batchFiles.length}` : (compressedFile ? `${compressedFile.width}x${compressedFile.height} · ${compressedFile.frameCount}帧` : '--')}
                </Typography>
              </Paper>
              <Paper sx={{ flex: 1, p: 2.5, bgcolor: 'background.paper', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  {batchFiles.length > 0 ? '平均节省率' : '压缩率'}
                </Typography>
                <Typography variant="h5" color="success.main" sx={{ mt: 1, mb: 0.5, fontWeight: 'bold' }}>
                  {batchFiles.length > 0 
                    ? (batchStats.completedCount > 0 ? `-${batchStats.ratio.toFixed(0)}%` : '--') 
                    : (originalFile && compressedFile ? `-${((1 - compressedFile.size / originalFile.size) * 100).toFixed(0)}%` : '--')}
                </Typography>
                <Typography variant="caption" color="success.main">
                  {batchFiles.length > 0 
                    ? (batchStats.completedCount > 0 ? `共节省 ${formatSize(batchStats.saved)}` : '等待开始') 
                    : (originalFile && compressedFile ? `成功节省 ${formatSize(originalFile.size - compressedFile.size)}` : '--')}
                </Typography>
              </Paper>
            </Box>

            {/* Success Banner */}
            {compressedFile && !batchFiles.length && (
              <Paper sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.1)' : '#F0FDF4', border: '1px solid', borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.3)' : '#BBF7D0', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircleOutlined color="success" />
                  <Box>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {gifExportFormat === 'gif' ? '压缩已完成！' : '转换已完成！'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {gifExportFormat === 'gif'
                        ? `已顺利优化至 ${formatSize(compressedFile.size)} 以内，完美契合各大社交平台限制。`
                        : `已顺利转换为 ${gifExportFormat.toUpperCase()} 格式，大小为 ${formatSize(compressedFile.size)}。`
                      }
                    </Typography>
                  </Box>
                </Box>
                <Button 
                  variant="contained" 
                  startIcon={<SaveAlt />}
                  onClick={() => window.electronAPI.showItemInFolder(compressedFile.path)}
                  sx={{ borderRadius: 6, bgcolor: (theme) => theme.palette.mode === 'dark' ? '#E0E0E0' : '#111827', color: (theme) => theme.palette.mode === 'dark' ? '#000' : '#fff', '&:hover': { bgcolor: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#374151' } }}
                >
                  保存并定位
                </Button>
              </Paper>
            )}

            {/* Batch Success Banner */}
            {batchFiles.length > 0 && !isBatchCompressing && batchFiles.every(f => f.status === 'completed' || f.status === 'failed') && batchFiles.some(f => f.status === 'completed') && (
              <Paper sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.1)' : '#F0FDF4', border: '1px solid', borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.3)' : '#BBF7D0', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircleOutlined color="success" />
                  <Box>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>批量优化完成！</Typography>
                    <Typography variant="caption" color="text.secondary">成功压缩了 {batchFiles.filter(f => f.status === 'completed').length} 个文件，共节省了 {formatSize(batchStats.saved)} 空间。</Typography>
                  </Box>
                </Box>
                {batchFiles.find(f => f.status === 'completed')?.outputPath && (
                  <Button 
                    variant="contained" 
                    startIcon={<SaveAlt />}
                    onClick={() => window.electronAPI.showItemInFolder(batchFiles.find(f => f.status === 'completed')!.outputPath!)}
                    sx={{ borderRadius: 6, bgcolor: (theme) => theme.palette.mode === 'dark' ? '#E0E0E0' : '#111827', color: (theme) => theme.palette.mode === 'dark' ? '#000' : '#fff', '&:hover': { bgcolor: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#374151' } }}
                  >
                    定位输出目录
                  </Button>
                )}
              </Paper>
            )}
          </Box>
        ) : (
          // ==========================================
          // Tab 2: Video & Live Photo View
          // ==========================================
          <Box sx={{ flex: 1, px: 4, pb: 4, display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  size="small"
                  sx={{ mr: 0.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', color: 'text.secondary' }}
                >
                  <Menu fontSize="small" />
                </IconButton>
                <CropOriginal sx={{ color: 'text.secondary' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>视频转换器</Typography>
              </Box>
              {videoOriginalFile && (
                <Button 
                  variant="outlined" 
                  startIcon={<DeleteOutlined />} 
                  onClick={handleRemoveVideo}
                  size="small"
                  sx={{ borderRadius: 6, borderColor: 'divider', color: 'text.primary' }}
                >
                  移除视频
                </Button>
              )}
            </Box>

            {/* Main Display Area */}
            <Paper sx={{ 
              flex: 1, 
              minHeight: 360,
              display: 'flex', 
              flexDirection: 'column', 
              bgcolor: 'background.paper',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 2
            }}>
              {!videoOriginalFile ? (
                <Box 
                  sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed', borderColor: 'divider', m: 2, borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={handleSelectVideoFile}
                >
                  <CloudUpload sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>点击选择视频或 Live Photo 图片文件</Typography>
                  <Typography variant="caption" color="text.secondary">支持 MP4, MOV, WEBM 以及实况照片 (HEIC/JPG + MOV)</Typography>
                </Box>
              ) : (
                <Box sx={{ flex: 1, p: 2, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  {/* Info Badge */}
                  {videoOriginalFile.isLivePhoto && (
                    <Box sx={{ mb: 1.5 }}>
                      <Chip 
                        label={`已识别为 Live Photo，自动链接伴侣视频: ${getCompanionBaseName(videoOriginalFile.videoPath)}`} 
                        color="primary" 
                        variant="outlined" 
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                  )}
                  
                  <Box sx={{ flex: 1 }}>
                    {!videoConvertedFile ? (
                      <video 
                        src={`media://${videoOriginalFile.videoPath}`}
                        controls
                        poster={videoOriginalFile.previewBase64}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8, backgroundColor: '#000' }}
                      />
                    ) : (
                      // For GIF export, we can slide. For LivePhoto export, we just show output JPG since it represents the Live Photo
                      videoConvertedFile.isLivePhoto ? (
                        <Box 
                          component="img"
                          src={videoConvertedFile.base64} 
                          sx={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'contain', 
                            borderRadius: 2, 
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0a0a0c' : '#F3F4F6' 
                          }} 
                        />
                      ) : (
                        <ImageSlider 
                          key={`${videoConvertedFile.outputPath}_${videoConvertedFile.size}`}
                          originalSrc={videoOriginalFile.previewBase64} 
                          compressedSrc={videoConvertedFile.base64} 
                        />
                      )
                    )}
                  </Box>
                </Box>
              )}
              
              {loading && (
                <Box sx={{ position: 'absolute', inset: 0, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(20,20,25,0.8)' : 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <CircularProgress size={60} thickness={4} />
                </Box>
              )}
            </Paper>

            {/* Stats Area */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Paper sx={{ flex: 1, p: 2.5, bgcolor: 'background.paper', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>源文件大小</Typography>
                <Typography variant="h5" sx={{ mt: 1, mb: 0.5, fontWeight: 'bold' }}>{videoOriginalFile ? formatSize(videoOriginalFile.size) : '--'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {videoOriginalFile ? `${videoOriginalFile.width}x${videoOriginalFile.height} · ${videoOriginalFile.duration.toFixed(1)}s · ${videoOriginalFile.isLivePhoto ? 'Live Photo' : '视频'}` : '--'}
                </Typography>
              </Paper>
              <Paper sx={{ flex: 1, p: 2.5, bgcolor: 'background.paper', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>导出大小</Typography>
                <Typography variant="h5" sx={{ mt: 1, mb: 0.5, fontWeight: 'bold' }}>{videoConvertedFile ? formatSize(videoConvertedFile.size) : '--'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {videoConvertedFile ? `${videoConvertedFile.width}x${videoConvertedFile.height}` : '--'}
                </Typography>
              </Paper>
              <Paper sx={{ flex: 1, p: 2.5, bgcolor: 'background.paper', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>导出类型</Typography>
                <Typography variant="h5" sx={{ mt: 1, mb: 0.5, fontWeight: 'bold' }}>
                  {getExportTypeLabel()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getExportTypeSubtitle()}
                </Typography>
              </Paper>
            </Box>

            {/* Success Banner */}
            {videoConvertedFile && (
              <Paper sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.1)' : '#F0FDF4', border: '1px solid', borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.3)' : '#BBF7D0', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircleOutlined color="success" />
                  <Box>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {videoConvertedFile.isLivePhoto ? 'Live Photo 制作完成！' : `${getExportTypeLabel()} 转换已完成！`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {videoConvertedFile.isLivePhoto 
                        ? `已成功生成配对图像与视频文件，大小共 ${formatSize(videoConvertedFile.size)}。`
                        : `已成功导出高品质 ${getExportTypeLabel()}，大小为 ${formatSize(videoConvertedFile.size)}。`
                      }
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  {!videoConvertedFile.isLivePhoto && videoConvertedFile.outputPath.endsWith('.gif') && (
                    <Button 
                      variant="outlined"
                      onClick={handleImportToCompress}
                      sx={{ borderRadius: 6, borderColor: 'divider', color: 'text.primary' }}
                    >
                      导入并压缩
                    </Button>
                  )}
                  <Button 
                    variant="contained" 
                    startIcon={<SaveAlt />}
                    onClick={() => window.electronAPI.showItemInFolder(videoConvertedFile.outputPath)}
                    sx={{ borderRadius: 6, bgcolor: (theme) => theme.palette.mode === 'dark' ? '#E0E0E0' : '#111827', color: (theme) => theme.palette.mode === 'dark' ? '#000' : '#fff', '&:hover': { bgcolor: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#374151' } }}
                  >
                    保存并定位
                  </Button>
                </Box>
              </Paper>
            )}
          </Box>
        )}
      </Box>

      {/* Settings Side Panels */}
      {activeTab === 'compress' ? (
        <RightPanel 
          exportFormat={gifExportFormat}
          setExportFormat={setGifExportFormat}
          targetMB={targetMB} setTargetMB={setTargetMB}
          lossy={lossy} setLossy={setLossy}
          colors={colors} setColors={setColors}
          scaleWidth={compressScaleWidth} setScaleWidth={setCompressScaleWidth}
          originalWidth={originalFile ? originalFile.width || 0 : (batchFiles.length > 0 ? 3000 : 0)}
          optimizeLevel={optimizeLevel} setOptimizeLevel={setOptimizeLevel}
          dither={dither} setDither={setDither}
          cropTransparency={cropTransparency} setCropTransparency={setCropTransparency}
          frameRateDivisor={frameRateDivisor} setFrameRateDivisor={setFrameRateDivisor}
          speedMultiplier={speedMultiplier} setSpeedMultiplier={setSpeedMultiplier}
          onSmartCompress={batchFiles.length > 0 ? () => handleBatchCompress('smart') : handleSmartCompress}
          onManualCompress={batchFiles.length > 0 ? () => handleBatchCompress('manual') : handleManualCompress}
          loading={loading || isBatchCompressing}
          disabled={!originalFile && batchFiles.length === 0}
        />
      ) : (
        <VideoRightPanel
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          videoDuration={videoOriginalFile ? videoOriginalFile.duration : 0}
          scaleWidth={scaleWidth}
          setScaleWidth={setScaleWidth}
          originalWidth={videoOriginalFile ? videoOriginalFile.width : 0}
          fps={fps}
          setFps={setFps}
          dither={videoDither}
          setDither={setVideoDither}
          speed={speed}
          setSpeed={setSpeed}
          onConvert={handleVideoConvert}
          loading={loading}
          disabled={!videoOriginalFile}
        />
      )}
    </Box>
  );
}
