import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  compressGifManual: (args: any) => ipcRenderer.invoke('compress-gif-manual', args),
  compressGifSmart: (args: any) => ipcRenderer.invoke('compress-gif-smart', args),
  readGifBase64: async (filePath: string) => {
    return ipcRenderer.invoke('read-file-base64', filePath);
  },
  getFileStats: (filePath: string) => ipcRenderer.invoke('get-file-stats', filePath),
  getFrameCount: (filePath: string) => ipcRenderer.invoke('get-frame-count', filePath),
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('show-item-in-folder', filePath),
  openVideoOrLivePhotoDialog: () => ipcRenderer.invoke('open-video-or-live-photo-dialog'),
  parseVideoPath: (filePath: string) => ipcRenderer.invoke('parse-video-path', filePath),
  convertVideoToGif: (args: any) => ipcRenderer.invoke('convert-video-to-gif', args),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
  onCompressProgress: (callback: any) => {
    const subscription = (event: any, value: number) => callback(value);
    ipcRenderer.on('compress-progress', subscription);
    return () => {
      ipcRenderer.removeListener('compress-progress', subscription);
    };
  },
});
