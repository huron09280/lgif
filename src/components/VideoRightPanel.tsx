import { Box, Typography, Button, Paper, Slider, Chip, Select, MenuItem, Divider, alpha, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { AutoFixHigh, Tune, Movie, PhotoLibrary, Animation, BurstMode } from '@mui/icons-material';

interface VideoRightPanelProps {
  exportFormat: 'gif' | 'webp' | 'apng' | 'livephoto';
  setExportFormat: (v: 'gif' | 'webp' | 'apng' | 'livephoto') => void;
  timeRange: [number, number];
  setTimeRange: (v: [number, number]) => void;
  videoDuration: number;
  scaleWidth: number;
  setScaleWidth: (v: number) => void;
  originalWidth: number;
  fps: number;
  setFps: (v: number) => void;
  dither: 'bayer' | 'floyd_steinberg' | 'none';
  setDither: (v: 'bayer' | 'floyd_steinberg' | 'none') => void;
  speed: number;
  setSpeed: (v: number) => void;
  onConvert: () => void;
  loading: boolean;
  disabled: boolean;
}

export default function VideoRightPanel({
  exportFormat, setExportFormat,
  timeRange, setTimeRange, videoDuration,
  scaleWidth, setScaleWidth, originalWidth,
  fps, setFps,
  dither, setDither,
  speed, setSpeed,
  onConvert, loading, disabled
}: VideoRightPanelProps) {
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const handleTimeChange = (_: any, newValue: number | number[]) => {
    setTimeRange(newValue as [number, number]);
  };

  return (
    <Box sx={{ width: 360, p: 3, display: 'flex', flexDirection: 'column', gap: 4, bgcolor: 'background.paper', overflowY: 'auto' }}>
      
      {/* Format Selection Card */}
      <Paper sx={{ 
        p: 3, 
        borderRadius: 2,
        background: (theme) => `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
        flexShrink: 0
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontWeight: 'bold' }} color="text.primary">选择导出格式</Typography>
          <Chip label="功能选择" size="small" sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 'bold', fontSize: 10, height: 20, borderRadius: 1 }} />
        </Box>
        
        <ToggleButtonGroup
          value={exportFormat}
          exclusive
          onChange={(_, val) => val && setExportFormat(val)}
          fullWidth
          size="small"
          sx={{ 
            mb: 2, 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: 1,
            bgcolor: 'transparent',
            '& .MuiToggleButtonGroup-grouped': {
              border: '1px solid !important',
              borderColor: 'divider',
              borderRadius: '8px !important',
              '&.Mui-selected': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                borderColor: 'primary.main !important',
              }
            }
          }}
        >
          <ToggleButton value="gif" sx={{ py: 1, gap: 1 }}>
            <Movie fontSize="small" />
            导出 GIF
          </ToggleButton>
          <ToggleButton value="webp" sx={{ py: 1, gap: 1 }}>
            <Animation fontSize="small" />
            导出 WebP
          </ToggleButton>
          <ToggleButton value="apng" sx={{ py: 1, gap: 1 }}>
            <BurstMode fontSize="small" />
            导出 APNG
          </ToggleButton>
          <ToggleButton value="livephoto" sx={{ py: 1, gap: 1 }}>
            <PhotoLibrary fontSize="small" />
            Live Photo
          </ToggleButton>
        </ToggleButtonGroup>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3, lineHeight: 1.6, height: 48, overflow: 'hidden' }}>
          {exportFormat === 'gif' && '将视频指定时段转换为高画质 GIF 动图，自动优化色彩精度。'}
          {exportFormat === 'webp' && '将视频指定时段转换为高画质 WebP 动图，体积更小，全彩且流畅。'}
          {exportFormat === 'apng' && '将视频指定时段转换为 APNG 动图，支持无损全彩，广泛兼容。'}
          {exportFormat === 'livephoto' && '提取静态照片与视频，注入 Apple MakerNote 关联元数据生成原生 Live Photo。'}
        </Typography>

        <Button 
          fullWidth 
          variant="contained" 
          startIcon={<AutoFixHigh />} 
          onClick={onConvert}
          disabled={disabled || loading}
          sx={{ py: 1.5, borderRadius: 2 }}
        >
          {loading ? '正在处理中...' : (exportFormat === 'livephoto' ? '生成 Live Photo' : `生成 ${exportFormat.toUpperCase()}`)}
        </Button>
      </Paper>

      {/* Settings Panel */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tune sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Typography sx={{ fontWeight: 'bold' }} color="text.secondary">参数微调面板</Typography>
        </Box>

        {/* 1. Time Range Selector */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">截取时段 (Range)</Typography>
            <Chip 
              label={`${formatTime(timeRange[0])} - ${formatTime(timeRange[1])} (共 ${(timeRange[1] - timeRange[0]).toFixed(1)}s)`} 
              size="small" 
              sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 'bold', height: 22, borderRadius: 1 }} 
            />
          </Box>
          <Slider
            value={timeRange}
            onChange={handleTimeChange}
            min={0}
            max={videoDuration || 10}
            step={0.1}
            valueLabelFormat={formatTime}
            valueLabelDisplay="auto"
            disabled={disabled}
          />
        </Box>

        {/* 2. Playback Speed */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">播放速度 (Speed)</Typography>
          </Box>
          <Select
            size="small"
            fullWidth
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            sx={{ borderRadius: 1 }}
            disabled={disabled}
          >
            <MenuItem value={0.5}>0.5x 慢速播放</MenuItem>
            <MenuItem value={0.75}>0.75x</MenuItem>
            <MenuItem value={1.0}>1.0x 正常速度</MenuItem>
            <MenuItem value={1.25}>1.25x</MenuItem>
            <MenuItem value={1.5}>1.5x</MenuItem>
            <MenuItem value={2.0}>2.0x 快速播放</MenuItem>
          </Select>
        </Box>

        <Divider sx={{ my: 1, borderColor: 'divider' }} />

        {/* Settings for GIF, WebP, and APNG */}
        {['gif', 'webp', 'apng'].includes(exportFormat) && (
          <>
            {/* 3. Resolution scale */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">导出分辨率宽度 (Width)</Typography>
                <Chip 
                  label={scaleWidth === -1 ? '原始宽度' : `${scaleWidth} px`} 
                  size="small" 
                  sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 'bold', height: 22, borderRadius: 1 }} 
                />
              </Box>
              <Slider 
                value={scaleWidth === -1 ? originalWidth || 640 : scaleWidth} 
                onChange={(_, v) => setScaleWidth(v as number)} 
                min={120} 
                max={originalWidth || 1920} 
                disabled={disabled}
              />
            </Box>

            {/* 4. Frame rate */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">帧率 (FPS)</Typography>
                <Chip 
                  label={`${fps} FPS`} 
                  size="small" 
                  sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 'bold', height: 22, borderRadius: 1 }} 
                />
              </Box>
              <Slider 
                value={fps} 
                onChange={(_, v) => setFps(v as number)} 
                min={5} 
                max={30} 
                step={1}
                disabled={disabled}
              />
            </Box>

            {/* 5. Dither Algorithm - GIF only */}
            {exportFormat === 'gif' && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">抖动算法 (Dither)</Typography>
                </Box>
                <Select
                  size="small"
                  fullWidth
                  value={dither}
                  onChange={(e) => setDither(e.target.value as any)}
                  sx={{ borderRadius: 1 }}
                  disabled={disabled}
                >
                  <MenuItem value="floyd_steinberg">Floyd-Steinberg (高画质，体积大)</MenuItem>
                  <MenuItem value="bayer">Bayer grid (网格抖动，体积适中)</MenuItem>
                  <MenuItem value="none">None (无抖动，色彩少，体积极小)</MenuItem>
                </Select>
              </Box>
            )}
          </>
        )}

        {exportFormat === 'livephoto' && (
          <Paper sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
              💡 <b>Live Photo 说明：</b>
              <br />
              将同时生成一个 <b>.jpg</b> 静态图像与 <b>.mov</b> 视频文件并保存在同一文件夹下。
              您只需使用 Airdrop 或 Apple Photos 将它们同时导入，系统将自动识别并展示为一张原生的 Live Photo 动图。
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
