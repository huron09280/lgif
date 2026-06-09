import { app, BrowserWindow, ipcMain, dialog, protocol, net, nativeImage } from 'electron';
import path from 'path';
import { execFile, exec, execSync } from 'child_process';
import fs from 'fs';
import util from 'util';
import crypto from 'crypto';

const getGifsiclePath = (): string => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');
  }
  return process.platform === 'win32'
    ? path.join(app.getAppPath(), 'bin/win/gifsicle.exe')
    : path.join(app.getAppPath(), 'bin/mac/gifsicle');
};

// 补全 macOS 常见的 PATH 环境变量，特别是从 GUI 启动时可能会缺失 Homebrew 等路径
if (process.platform === 'darwin') {
  const commonPaths = ['/opt/homebrew/bin', '/usr/local/bin'];
  const currentPath = process.env.PATH || '';
  const newPaths = commonPaths.filter(p => !currentPath.includes(p) && fs.existsSync(p));
  if (newPaths.length > 0) {
    process.env.PATH = [...newPaths, currentPath].filter(Boolean).join(':');
    console.log('Updated process.env.PATH to include:', newPaths.join(':'));
  }
}

const execPromise = util.promisify(exec);

// 检测系统是否安装 ffmpeg 与 ffprobe
const checkMediaTools = (): { ffmpeg: boolean; ffprobe: boolean } => {
  let ffmpeg = false;
  let ffprobe = false;
  try {
    execSync('which ffmpeg', { stdio: 'ignore' });
    ffmpeg = true;
  } catch (e) {
    ffmpeg = false;
  }
  try {
    execSync('which ffprobe', { stdio: 'ignore' });
    ffprobe = true;
  } catch (e) {
    ffprobe = false;
  }
  return { ffmpeg, ffprobe };
};

// 检查媒体处理依赖，如果缺失则弹出提示框
const ensureMediaToolsOrWarn = (): boolean => {
  const { ffmpeg, ffprobe } = checkMediaTools();
  if (!ffmpeg || !ffprobe) {
    const missing = [];
    if (!ffmpeg) missing.push('ffmpeg');
    if (!ffprobe) missing.push('ffprobe');
    
    dialog.showMessageBoxSync({
      type: 'error',
      title: '缺失媒体处理依赖',
      message: `检测到系统未安装媒体处理工具：${missing.join(' 和 ')}。`,
      detail: '本应用需要 ffmpeg 和 ffprobe 进行视频与实况照片的处理与转换。\n\n请在终端中运行以下命令进行安装（需要安装 Homebrew）：\nbrew install ffmpeg\n\n如果您已安装，请确保已将其路径添加到环境变量中并重启应用。',
      buttons: ['确定']
    });
    return false;
  }
  return true;
};

// Register custom protocol for streaming local media files in React
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true
    }
  }
]);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  let windowIconPath = path.join(__dirname, '../public/logo.png');
  if (!fs.existsSync(windowIconPath)) {
    windowIconPath = path.join(app.getAppPath(), 'dist/logo.png');
  }

  // macOS Dock Icon setup during development/runtime
  if (process.platform === 'darwin' && fs.existsSync(windowIconPath)) {
    try {
      const image = nativeImage.createFromPath(windowIconPath);
      app.dock.setIcon(image);
    } catch (err) {
      console.error('Failed to set macOS dock icon:', err);
    }
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset', // Material UI + macOS style
    icon: fs.existsSync(windowIconPath) ? windowIconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

const ensureWriterCompiled = () => {
  const binDir = app.getPath('userData');
  const binPath = path.join(binDir, 'livephoto-writer');
  
  if (!fs.existsSync(binPath)) {
    // Check if precompiled binary exists in extraResources (production packaging)
    const resourceBinPath = path.join(process.resourcesPath, 'livephoto-writer');
    if (fs.existsSync(resourceBinPath)) {
      console.log('Copying precompiled livephoto-writer from resources...');
      try {
        fs.copyFileSync(resourceBinPath, binPath);
        try { fs.chmodSync(binPath, '755'); } catch (e) {}
        console.log('Precompiled livephoto-writer copied successfully.');
        return binPath;
      } catch (err) {
        console.error('Failed to copy precompiled binary:', err);
      }
    }

    let srcPath = path.join(app.getAppPath(), 'electron/livephoto-writer.swift');
    if (!fs.existsSync(srcPath)) {
      srcPath = path.join(process.resourcesPath, 'livephoto-writer.swift');
    }
    if (!fs.existsSync(srcPath)) {
      srcPath = path.join(app.getAppPath(), 'dist-electron/livephoto-writer.swift');
    }

    if (fs.existsSync(srcPath)) {
      console.log(`Compiling livephoto-writer.swift asynchronously from ${srcPath} to ${binPath}...`);
      exec(`swiftc -O "${srcPath}" -o "${binPath}"`, (err) => {
        if (err) {
          console.error('Failed to compile livephoto-writer:', err);
        } else {
          try { fs.chmodSync(binPath, '755'); } catch (e) {}
          console.log('livephoto-writer compiled successfully.');
        }
      });
    } else {
      console.error('Source livephoto-writer.swift not found!');
    }
  }
  return binPath;
};

app.whenReady().then(() => {
  // Register local media server handler
  protocol.handle('media', (request) => {
    let filePath = decodeURIComponent(request.url.replace('media://', ''));
    if (!filePath.startsWith('/')) {
      filePath = '/' + filePath;
    }
    return net.fetch(`file://${filePath}`);
  });

  setTimeout(() => {
    ensureWriterCompiled();
  }, 500);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const getFrameCount = (inputPath: string): Promise<number> => {
  const ext = path.extname(inputPath).toLowerCase();
  if (ext === '.gif') {
    return new Promise((resolve) => {
      execFile(getGifsiclePath(), ['-I', inputPath], (error, stdout) => {
        if (error) {
          resolve(0);
          return;
        }
        const match = stdout.match(/(\d+) images/i);
        if (match && match[1]) {
          resolve(parseInt(match[1], 10));
        } else {
          resolve(0);
        }
      });
    });
  } else {
    return new Promise((resolve) => {
      const cmd = `ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "${inputPath}"`;
      exec(cmd, (error, stdout) => {
        if (error) {
          const fallbackCmd = `ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 "${inputPath}"`;
          exec(fallbackCmd, (fallbackErr, fallbackStdout) => {
            if (fallbackErr) {
              resolve(0);
            } else {
              resolve(parseInt(fallbackStdout.trim(), 10) || 0);
            }
          });
          return;
        }
        resolve(parseInt(stdout.trim(), 10) || 0);
      });
    });
  }
};

const getFrameDelays = async (inputPath: string, frameCount: number): Promise<number[]> => {
  const delays: number[] = [];
  try {
    const { stdout } = await execPromise(`"${getGifsiclePath()}" -I "${inputPath}"`);
    const lines = stdout.split('\n');
    let currentFrameIndex = -1;
    for (const line of lines) {
      if (line.includes('+ image')) {
        currentFrameIndex++;
        delays[currentFrameIndex] = 10; // 默认 10cs (0.10s)
      }
      const match = line.match(/delay\s+([\d.]+)s/);
      if (match && currentFrameIndex >= 0) {
        delays[currentFrameIndex] = Math.round(parseFloat(match[1]) * 100);
      }
    }
  } catch (e) {
    console.error('Failed to get frame delays:', e);
  }
  // 填充缺失的帧延迟
  while (delays.length < frameCount) {
    delays.push(10);
  }
  return delays.slice(0, frameCount);
};

const executeGifsicle = async (inputPath: string, outputPath: string, params: any) => {
  const { lossy, colors, scale, scaleWidth, optimizeLevel, dither, cropTransparency, frameRateDivisor, speedMultiplier, frameCount } = params;
  
  let currentInput = inputPath;
  let tempFile = '';

  const divisor = frameRateDivisor || 1;
  const speed = speedMultiplier || 1.0;

  // 如果需要降低帧率或改变播放速度
  if ((divisor > 1 || speed !== 1.0) && frameCount > 0) {
    tempFile = `${outputPath}.tmp.gif`;
    
    // 获取每一帧的原始延迟
    const originalDelays = await getFrameDelays(currentInput, frameCount);
    const keptFrameIndices: number[] = [];
    const newDelays: number[] = [];

    // 根据 divisor 进行抽帧，并累加延迟
    for (let i = 0; i < originalDelays.length; i += divisor) {
      keptFrameIndices.push(i);
      
      let sumDelay = 0;
      for (let j = 0; j < divisor; j++) {
        if (i + j < originalDelays.length) {
          sumDelay += originalDelays[i + j];
        }
      }
      
      // 应用速度倍率
      let adjustedDelay = Math.round(sumDelay / speed);
      if (adjustedDelay < 1) {
        adjustedDelay = 1; // 最小延迟不能为 0，否则部分播放器会有问题
      }
      newDelays.push(adjustedDelay);
    }

    // 拼装 gifsicle 抽帧与重设延迟参数
    const dropArgs = ['-U', currentInput];
    for (let idx = 0; idx < keptFrameIndices.length; idx++) {
      const origIndex = keptFrameIndices[idx];
      const newDelay = newDelays[idx];
      dropArgs.push('-d', String(newDelay), `#${origIndex}`);
    }
    dropArgs.push('-o', tempFile);

    await new Promise((resolve, reject) => {
      execFile(getGifsiclePath(), dropArgs, (err) => err ? reject(err) : resolve(true));
    });
    currentInput = tempFile;
  }

  // Pass 2: Optimization & Formatting
  const args = [currentInput, `-O${optimizeLevel || 3}`];
  if (lossy !== undefined) args.push(`--lossy=${lossy}`);
  if (colors) args.push(`--colors=${colors}`);
  if (scaleWidth && scaleWidth > 0) {
    args.push('--resize-width', String(scaleWidth));
  } else if (scale && scale !== 1) {
    args.push(`--scale=${scale}`);
  }
  if (dither) args.push('--dither=floyd-steinberg');
  if (cropTransparency) args.push('--crop-transparency');
  args.push('-o', outputPath);

  await new Promise((resolve, reject) => {
    execFile(getGifsiclePath(), args, (err) => err ? reject(err) : resolve(true));
  });

  // Cleanup temp file
  if (tempFile && fs.existsSync(tempFile)) {
    try { fs.unlinkSync(tempFile); } catch(e) {}
  }

  return fs.statSync(outputPath).size;
};

// IPC handler for manual compression
ipcMain.handle('compress-gif-manual', async (event, args) => {
  const { inputPath, exportFormat, scaleWidth, frameRateDivisor, speedMultiplier } = args;
  const ext = path.extname(inputPath);
  const basePath = inputPath.substring(0, inputPath.length - ext.length);

  if (exportFormat === 'webp' || exportFormat === 'apng') {
    const outputExt = exportFormat === 'webp' ? '.webp' : '.png';
    const outputPath = `${basePath}_converted_${Date.now()}${outputExt}`;

    let originalFps = 10;
    try {
      const fpsCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "${inputPath}"`;
      const { stdout: fpsOut } = await execPromise(fpsCmd);
      if (fpsOut.trim().includes('/')) {
        const [num, den] = fpsOut.trim().split('/');
        originalFps = parseFloat(num) / parseFloat(den);
      } else {
        originalFps = parseFloat(fpsOut.trim());
      }
    } catch (e) {
      originalFps = 10;
    }

    const divisor = frameRateDivisor || 1;
    const targetFps = Math.max(1, Math.round(originalFps / divisor));
    const speed = speedMultiplier || 1.0;

    const filters: string[] = [];
    if (speed !== 1.0) {
      filters.push(`setpts=PTS/${speed}`);
    }
    filters.push(`fps=${targetFps}`);
    if (scaleWidth > 0) {
      filters.push(`scale=${scaleWidth}:-1:flags=lanczos`);
    }

    if (exportFormat === 'webp') {
      let hasLibwebp = false;
      try {
        const { stdout } = await execPromise('ffmpeg -encoders');
        hasLibwebp = stdout.includes('libwebp');
      } catch (e) {
        hasLibwebp = false;
      }

      try {
        if (hasLibwebp) {
          filters.push('format=yuv420p');
          const filterString = filters.join(',');
          const cmd = `ffmpeg -i "${inputPath}" -vf "${filterString}" -vcodec libwebp -loop 0 -an -y "${outputPath}"`;
          await execPromise(cmd);
        } else {
          const tempGifPath = `${outputPath}.tmp.gif`;
          filters.push('format=yuv420p');
          const filterString = filters.join(',');
          const gifCmd = `ffmpeg -i "${inputPath}" -filter_complex "[0:v]${filterString},split[a][b];[a]palettegen[p];[b][p]paletteuse=dither=floyd_steinberg" -y "${tempGifPath}"`;
          await execPromise(gifCmd);

          const webpCmd = `gif2webp "${tempGifPath}" -o "${outputPath}"`;
          await execPromise(webpCmd);
          try { fs.unlinkSync(tempGifPath); } catch (e) {}
        }
      } catch (err: any) {
        console.error('Error converting GIF to WebP:', err);
        throw new Error(err.message || '转换 WebP 失败');
      }
    } else {
      // APNG
      filters.push('format=gbrp');
      const filterString = filters.join(',');
      const cmd = `ffmpeg -i "${inputPath}" -vf "${filterString}" -c:v apng -f apng -plays 0 -an -y "${outputPath}"`;
      try {
        await execPromise(cmd);
      } catch (err: any) {
        console.error('Error converting GIF to APNG:', err);
        throw new Error(err.message || '转换 APNG 失败');
      }
    }

    const size = fs.statSync(outputPath).size;
    return { outputPath, size };
  } else {
    // Original GIF compression using gifsicle
    const outputPath = `${basePath}_compressed${ext}`;
    const frameCount = await getFrameCount(inputPath);
    try {
      const size = await executeGifsicle(inputPath, outputPath, { ...args, frameCount });
      return { outputPath, size };
    } catch (error: any) {
      console.error('Compression error:', error);
      throw new Error(error.message || 'Compression failed');
    }
  }
});

// IPC handler for smart compression (target MB) with parallel execution
ipcMain.handle('compress-gif-smart', async (event, args) => {
  const { inputPath, targetSizeMB } = args;
  const targetSizeBytes = targetSizeMB * 1024 * 1024;
  
  const ext = path.extname(inputPath);
  const basePath = inputPath.substring(0, inputPath.length - ext.length);
  const finalOutputPath = `${basePath}_smart_compressed${ext}`;

  // Initial stats
  const initialStats = fs.statSync(inputPath);
  if (initialStats.size <= targetSizeBytes) {
    fs.copyFileSync(inputPath, finalOutputPath);
    return { outputPath: finalOutputPath, size: initialStats.size };
  }

  const frameCount = await getFrameCount(inputPath);

  // Define 5 parallel strategies (Gradient steps)
  const strategies = [
    { name: 'S1', optimizeLevel: 3, lossy: 50, colors: 256, scale: 0.9, dither: true, frameRateDivisor: 1, speedMultiplier: 1.0 },
    { name: 'S2', optimizeLevel: 3, lossy: 100, colors: 128, scale: 0.8, dither: true, frameRateDivisor: 1, speedMultiplier: 1.0 },
    { name: 'S3', optimizeLevel: 3, lossy: 150, colors: 64, scale: 0.7, dither: false, frameRateDivisor: 2, speedMultiplier: 1.0 },
    { name: 'S4', optimizeLevel: 2, lossy: 200, colors: 32, scale: 0.6, dither: false, frameRateDivisor: 2, speedMultiplier: 1.0 },
    { name: 'S5', optimizeLevel: 2, lossy: 200, colors: 16, scale: 0.5, dither: false, frameRateDivisor: 3, speedMultiplier: 1.0 },
  ];

  const promises = strategies.map(async (strategy) => {
    const outputPath = `${basePath}_smart_temp_${strategy.name}${ext}`;
    try {
      const size = await executeGifsicle(inputPath, outputPath, { ...strategy, frameCount });
      return { strategy: strategy.name, outputPath, size };
    } catch (error) {
      throw error;
    }
  });

  const results = await Promise.allSettled(promises);
  
  let bestResult: any = null;
  const validOutputs: any[] = [];

  for (const res of results) {
    if (res.status === 'fulfilled') {
      const { outputPath, size } = res.value as any;
      validOutputs.push({ outputPath, size });
      if (size <= targetSizeBytes) {
        if (!bestResult || size > bestResult.size) {
          // Find the largest size that is <= targetSizeBytes (maximizes quality)
          bestResult = { outputPath, size };
        }
      }
    }
  }

  // If no output is under target, pick the smallest overall
  if (!bestResult && validOutputs.length > 0) {
    bestResult = validOutputs.reduce((prev, curr) => curr.size < prev.size ? curr : prev);
  }
  
  if (bestResult) {
    fs.copyFileSync(bestResult.outputPath, finalOutputPath);
  }

  // Cleanup temp files
  for (const out of validOutputs) {
    try { fs.unlinkSync(out.outputPath); } catch(e) {}
  }

  if (bestResult) {
    return { outputPath: finalOutputPath, size: bestResult.size };
  } else {
    throw new Error('All compression strategies failed.');
  }
});

const getSettingsPath = () => {
  return path.join(app.getPath('userData'), 'settings.json');
};

// Load settings
ipcMain.handle('load-settings', () => {
  try {
    const p = getSettingsPath();
    if (fs.existsSync(p)) {
      const data = fs.readFileSync(p, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
  return null;
});

// Save settings
ipcMain.handle('save-settings', (event, settings) => {
  try {
    const p = getSettingsPath();
    fs.writeFileSync(p, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to save settings:', err);
    return false;
  }
});

// Open File Dialog
ipcMain.handle('open-file-dialog', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Images', extensions: ['gif'] }]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths;
  }
  return null;
});

// Read file as base64 for preview
ipcMain.handle('read-file-base64', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    let mimeType = 'image/gif';
    if (ext === '.webp') {
      mimeType = 'image/webp';
    } else if (ext === '.png' || ext === '.apng') {
      mimeType = 'image/png';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      mimeType = 'image/jpeg';
    }
    return `data:${mimeType};base64,${data.toString('base64')}`;
  } catch (err) {
    console.error('Failed to read file:', err);
    return null;
  }
});

// Get file stats
ipcMain.handle('get-file-stats', (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (err) {
    return 0;
  }
});

// Get frame count
ipcMain.handle('get-frame-count', async (event, filePath) => {
  try {
    return await getFrameCount(filePath);
  } catch (err) {
    return 0;
  }
});

// Show item in folder
ipcMain.handle('show-item-in-folder', (event, filePath) => {
  import('electron').then(({ shell }) => {
    shell.showItemInFolder(filePath);
  });
});

// Reusable helper function to parse video or Live Photo metadata
async function parseVideoOrLivePhotoFile(selectedPath: string) {
  const ext = path.extname(selectedPath).toLowerCase();
  
  let videoPath = '';
  let isLivePhoto = false;
  
  const isImage = ['.heic', '.heif', '.jpg', '.jpeg', '.png'].includes(ext);
  
  if (isImage) {
    const parentDir = path.dirname(selectedPath);
    const baseName = path.basename(selectedPath, path.extname(selectedPath));
    const possibleExts = ['.mov', '.MOV', '.mp4', '.MP4'];
    let foundVideo = '';
    for (const e of possibleExts) {
      const p = path.join(parentDir, baseName + e);
      if (fs.existsSync(p)) {
        foundVideo = p;
        break;
      }
    }
    
    if (foundVideo) {
      videoPath = foundVideo;
      isLivePhoto = true;
    } else {
      throw new Error(`未在同目录下找到对应的 Live Photo 视频组件（如同名 .mov 格式）`);
    }
  } else {
    videoPath = selectedPath;
    isLivePhoto = false;
  }

  const durationCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
  const { stdout: durOut } = await execPromise(durationCmd);
  const duration = parseFloat(durOut.trim()) || 0;
  
  const streamCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=s=x:p=0 "${videoPath}"`;
  const { stdout: streamOut } = await execPromise(streamCmd);
  const [wStr, hStr, fpsStr] = streamOut.trim().split('x');
  const width = parseInt(wStr, 10) || 0;
  const height = parseInt(hStr, 10) || 0;
  
  let fps = 30;
  if (fpsStr && fpsStr.includes('/')) {
    const [num, den] = fpsStr.split('/');
    fps = Math.round(parseFloat(num) / parseFloat(den)) || 30;
  } else if (fpsStr) {
    fps = Math.round(parseFloat(fpsStr)) || 30;
  }

  const tempPreviewPath = path.join(app.getPath('temp'), `preview_${Date.now()}_v.jpg`);
  const extractCmd = `ffmpeg -ss 0.1 -i "${videoPath}" -vframes 1 -q:v 2 -vf "format=yuv420p" -y "${tempPreviewPath}"`;
  await execPromise(extractCmd);
  
  let previewBase64 = '';
  if (fs.existsSync(tempPreviewPath)) {
    const buffer = fs.readFileSync(tempPreviewPath);
    previewBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    try { fs.unlinkSync(tempPreviewPath); } catch (e) {}
  }

  const stats = fs.statSync(selectedPath);

  return {
    path: selectedPath,
    videoPath,
    isLivePhoto,
    size: stats.size,
    duration,
    width,
    height,
    fps,
    previewBase64
  };
}

// IPC handler to open and parse video or Live Photo
ipcMain.handle('open-video-or-live-photo-dialog', async () => {
  if (!ensureMediaToolsOrWarn()) {
    return null;
  }
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: '视频与实况照片 (*.mp4, *.mov, *.heic, *.jpg)', extensions: ['mp4', 'MP4', 'mov', 'MOV', 'webm', 'WEBM', 'avi', 'AVI', 'heic', 'HEIC', 'heif', 'HEIF', 'jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG'] },
      { name: '视频文件 (*.mp4, *.mov, *.webm)', extensions: ['mp4', 'MP4', 'mov', 'MOV', 'webm', 'WEBM', 'avi', 'AVI'] },
      { name: '图片文件 (*.heic, *.jpg, *.png)', extensions: ['heic', 'HEIC', 'heif', 'HEIF', 'jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG'] },
      { name: '所有文件 (*)', extensions: ['*'] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  try {
    return await parseVideoOrLivePhotoFile(result.filePaths[0]);
  } catch (err: any) {
    console.error('Error parsing video metadata:', err);
    throw new Error(err.message || '解析视频元数据失败');
  }
});

// IPC handler to parse video path directly (for drag-and-drop)
ipcMain.handle('parse-video-path', async (event, filePath) => {
  if (!ensureMediaToolsOrWarn()) {
    return null;
  }
  try {
    return await parseVideoOrLivePhotoFile(filePath);
  } catch (err: any) {
    console.error('Error parsing video metadata:', err);
    throw new Error(err.message || '解析视频元数据失败');
  }
});

// IPC handler to convert video or generate Live Photo
ipcMain.handle('convert-video-to-gif', async (event, args) => {
  if (!ensureMediaToolsOrWarn()) {
    throw new Error('未检测到系统 ffmpeg/ffprobe 依赖，转换失败。');
  }
  const { inputPath, exportFormat, start, duration, scaleWidth, fps, dither, speed } = args;
  
  const ext = path.extname(inputPath);
  const basePath = inputPath.substring(0, inputPath.length - ext.length);
  
  if (exportFormat === 'gif') {
    const outputPath = `${basePath}_converted_${Date.now()}.gif`;
    
    const filters: string[] = [];
    if (speed !== 1.0) {
      filters.push(`setpts=PTS/${speed}`);
    }
    filters.push(`fps=${fps}`);
    if (scaleWidth > 0) {
      filters.push(`scale=${scaleWidth}:-1:flags=lanczos`);
    }
    // Convert to yuv420p to handle HDR content tone-mapping and maintain correct color properties for SDR
    filters.push('format=yuv420p');
    
    const filterString = filters.join(',');
    const ditherStr = dither === 'none' ? 'dither=none' : `dither=${dither}`;
    
    const cmd = `ffmpeg -ss ${start} -t ${duration} -i "${inputPath}" -filter_complex "[0:v]${filterString},split[a][b];[a]palettegen[p];[b][p]paletteuse=${ditherStr}" -y "${outputPath}"`;
    
    try {
      await execPromise(cmd);
      const size = fs.statSync(outputPath).size;
      
      const data = fs.readFileSync(outputPath);
      const base64 = `data:image/gif;base64,${data.toString('base64')}`;
      
      const finalFrameCount = await getFrameCount(outputPath);
      
      const gifStreamCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${outputPath}"`;
      const { stdout: gifStreamOut } = await execPromise(gifStreamCmd);
      const [gifW, gifH] = gifStreamOut.trim().split('x');
      
      return {
        outputPath,
        size,
        base64,
        width: parseInt(gifW, 10),
        height: parseInt(gifH, 10),
        frameCount: finalFrameCount
      };
    } catch (err: any) {
      console.error('Error converting video to GIF:', err);
      throw new Error(err.message || '转换 GIF 失败');
    }
  } else if (exportFormat === 'webp') {
    const outputPath = `${basePath}_converted_${Date.now()}.webp`;
    
    const filters: string[] = [];
    if (speed !== 1.0) {
      filters.push(`setpts=PTS/${speed}`);
    }
    filters.push(`fps=${fps}`);
    if (scaleWidth > 0) {
      filters.push(`scale=${scaleWidth}:-1:flags=lanczos`);
    }
    
    // Check if ffmpeg has libwebp encoder
    let hasLibwebp = false;
    try {
      const { stdout } = await execPromise('ffmpeg -encoders');
      hasLibwebp = stdout.includes('libwebp');
    } catch (e) {
      hasLibwebp = false;
    }
    
    try {
      if (hasLibwebp) {
        filters.push('format=yuv420p');
        const filterString = filters.join(',');
        const cmd = `ffmpeg -ss ${start} -t ${duration} -i "${inputPath}" -vf "${filterString}" -vcodec libwebp -loop 0 -an -y "${outputPath}"`;
        await execPromise(cmd);
      } else {
        // Fallback: Generate a temp GIF using ffmpeg, then convert using gif2webp
        const tempGifPath = `${outputPath}.tmp.gif`;
        filters.push('format=yuv420p');
        const filterString = filters.join(',');
        
        // We use split + palettegen + paletteuse for high-quality GIF conversion first
        const gifCmd = `ffmpeg -ss ${start} -t ${duration} -i "${inputPath}" -filter_complex "[0:v]${filterString},split[a][b];[a]palettegen[p];[b][p]paletteuse=dither=floyd_steinberg" -y "${tempGifPath}"`;
        await execPromise(gifCmd);
        
        // Then convert GIF to WebP using gif2webp
        const webpCmd = `gif2webp "${tempGifPath}" -o "${outputPath}"`;
        await execPromise(webpCmd);
        
        // Cleanup temp GIF
        try { fs.unlinkSync(tempGifPath); } catch (e) {}
      }
      
      const size = fs.statSync(outputPath).size;
      const data = fs.readFileSync(outputPath);
      const base64 = `data:image/webp;base64,${data.toString('base64')}`;
      
      const finalFrameCount = await getFrameCount(outputPath);
      
      const webpStreamCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${outputPath}"`;
      const { stdout: webpStreamOut } = await execPromise(webpStreamCmd);
      const [webpW, webpH] = webpStreamOut.trim().split('x');
      
      return {
        outputPath,
        size,
        base64,
        width: parseInt(webpW, 10),
        height: parseInt(webpH, 10),
        frameCount: finalFrameCount
      };
    } catch (err: any) {
      console.error('Error converting video to WebP:', err);
      throw new Error(err.message || '转换 WebP 失败');
    }
  } else if (exportFormat === 'apng') {
    const outputPath = `${basePath}_converted_${Date.now()}.png`;
    
    const filters: string[] = [];
    if (speed !== 1.0) {
      filters.push(`setpts=PTS/${speed}`);
    }
    filters.push(`fps=${fps}`);
    if (scaleWidth > 0) {
      filters.push(`scale=${scaleWidth}:-1:flags=lanczos`);
    }
    filters.push('format=gbrp');
    
    const filterString = filters.join(',');
    
    const cmd = `ffmpeg -ss ${start} -t ${duration} -i "${inputPath}" -vf "${filterString}" -c:v apng -f apng -plays 0 -an -y "${outputPath}"`;
    
    try {
      await execPromise(cmd);
      const size = fs.statSync(outputPath).size;
      
      const data = fs.readFileSync(outputPath);
      const base64 = `data:image/png;base64,${data.toString('base64')}`;
      
      const finalFrameCount = await getFrameCount(outputPath);
      
      const apngStreamCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${outputPath}"`;
      const { stdout: apngStreamOut } = await execPromise(apngStreamCmd);
      const [apngW, apngH] = apngStreamOut.trim().split('x');
      
      return {
        outputPath,
        size,
        base64,
        width: parseInt(apngW, 10),
        height: parseInt(apngH, 10),
        frameCount: finalFrameCount
      };
    } catch (err: any) {
      console.error('Error converting video to APNG:', err);
      throw new Error(err.message || '转换 APNG 失败');
    }
  } else if (exportFormat === 'livephoto') {
    const suffix = Date.now();
    const outImgPath = `${basePath}_live_${suffix}.jpg`;
    const outVidPath = `${basePath}_live_${suffix}.mov`;
    const tempVidPath = path.join(app.getPath('temp'), `temp_live_${suffix}.mov`);
    
    try {
      const imgCmd = `ffmpeg -ss ${start} -i "${inputPath}" -vframes 1 -q:v 2 -vf "format=yuv420p" -y "${outImgPath}"`;
      await execPromise(imgCmd);
      
      let vidCmd = '';
      if (speed !== 1.0) {
        vidCmd = `ffmpeg -ss ${start} -t ${duration} -i "${inputPath}" -filter_complex "[0:v]setpts=PTS/${speed}[v]" -map "[v]" -c:v libx264 -pix_fmt yuv420p -an -y "${tempVidPath}"`;
      } else {
        vidCmd = `ffmpeg -ss ${start} -t ${duration} -i "${inputPath}" -c:v libx264 -pix_fmt yuv420p -an -y "${tempVidPath}"`;
      }
      await execPromise(vidCmd);
      
      const writerBin = ensureWriterCompiled();
      
      const assetUuid = crypto.randomUUID().toUpperCase();
      
      const metaCmd = `"${writerBin}" --image "${outImgPath}" --video "${tempVidPath}" --output-image "${outImgPath}" --output-video "${outVidPath}" --uuid "${assetUuid}"`;
      await execPromise(metaCmd);
      
      try { fs.unlinkSync(tempVidPath); } catch (e) {}
      
      const imgSize = fs.statSync(outImgPath).size;
      const vidSize = fs.statSync(outVidPath).size;
      
      const imgData = fs.readFileSync(outImgPath);
      const base64 = `data:image/jpeg;base64,${imgData.toString('base64')}`;
      
      const imgStreamCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${outImgPath}"`;
      const { stdout: imgStreamOut } = await execPromise(imgStreamCmd);
      const [imgW, imgH] = imgStreamOut.trim().split('x');
      
      return {
        outputPath: outImgPath,
        videoPath: outVidPath,
        size: imgSize + vidSize,
        base64,
        width: parseInt(imgW, 10),
        height: parseInt(imgH, 10),
        isLivePhoto: true
      };
    } catch (err: any) {
      console.error('Error generating Live Photo:', err);
      try { fs.unlinkSync(outImgPath); } catch (e) {}
      try { fs.unlinkSync(outVidPath); } catch (e) {}
      try { fs.unlinkSync(tempVidPath); } catch (e) {}
      throw new Error(err.message || '生成 Live Photo 失败');
    }
  }
});
