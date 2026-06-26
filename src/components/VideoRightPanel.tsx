import { useState } from 'react';
import { Box, Typography, Button, Paper, Slider, Chip, Select, MenuItem, Divider, alpha, ToggleButton, ToggleButtonGroup, Switch, Menu } from '@mui/material';
import { AutoFixHigh, Tune, Movie, PhotoLibrary, Animation, BurstMode, KeyboardArrowDown } from '@mui/icons-material';

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
  playMode: 'normal' | 'alternate';
  setPlayMode: (v: 'normal' | 'alternate') => void;
  clarity: number;
  setClarity: (v: number) => void;
  sharpness: number;
  setSharpness: (v: number) => void;
  onConvert: () => void;
  loading: boolean;
  disabled: boolean;
  targetMB: number;
  setTargetMB: (v: number) => void;
  lossy: number;
  setLossy: (v: number) => void;
  colors: number;
  setColors: (v: number) => void;
  optimizeLevel: number;
  setOptimizeLevel: (v: number) => void;
  cropTransparency: boolean;
  setCropTransparency: (v: boolean) => void;
  onSmartCompress: () => void;
}

export default function VideoRightPanel({
  exportFormat, setExportFormat,
  timeRange, setTimeRange, videoDuration,
  scaleWidth, setScaleWidth, originalWidth,
  fps, setFps,
  dither, setDither,
  speed, setSpeed,
  playMode, setPlayMode,
  clarity, setClarity,
  sharpness, setSharpness,
  onConvert, loading, disabled,
  targetMB, setTargetMB: _setTargetMB,
  lossy, setLossy,
  colors, setColors,
  optimizeLevel, setOptimizeLevel,
  cropTransparency, setCropTransparency,
  onSmartCompress
}: VideoRightPanelProps) {
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleSelectFormat = (format: 'gif' | 'webp' | 'apng' | 'livephoto') => {
    setExportFormat(format);
    handleClose();
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'gif': return <Movie fontSize="small" />;
      case 'webp': return <Animation fontSize="small" />;
      case 'apng': return <BurstMode fontSize="small" />;
      case 'livephoto': return <PhotoLibrary fontSize="small" />;
      default: return <Movie fontSize="small" />;
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'gif': return '格式: GIF';
      case 'webp': return '格式: WebP';
      case 'apng': return '格式: APNG';
      case 'livephoto': return '格式: Live Photo';
      default: return '';
    }
  };

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
    <Box sx={{ width: 360, display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper', overflow: 'hidden' }}>
      
      {/* Sticky Header with Format Dropdown Menu */}
      <Box sx={{ 
        p: 3, 
        pb: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexShrink: 0
      }}>
        <Typography sx={{ fontWeight: 'bold' }} color="text.secondary">视频/LivePhoto转GIF</Typography>
        <Box>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleClick}
            startIcon={getFormatIcon(exportFormat)}
            endIcon={<KeyboardArrowDown />}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              borderColor: 'primary.main',
              color: 'primary.main',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                borderColor: 'primary.dark'
              }
            }}
          >
            {getFormatLabel(exportFormat)}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            sx={{
              '& .MuiPaper-root': {
                borderRadius: 2,
                minWidth: 150,
                boxShadow: '0px 4px 20px rgba(0,0,0,0.1)'
              }
            }}
          >
            <MenuItem onClick={() => handleSelectFormat('gif')} selected={exportFormat === 'gif'} sx={{ gap: 1.5, fontSize: 13, py: 1 }}>
              <Movie fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontWeight: exportFormat === 'gif' ? 'bold' : 'normal' }}>导出 GIF</Typography>
            </MenuItem>
            <MenuItem onClick={() => handleSelectFormat('webp')} selected={exportFormat === 'webp'} sx={{ gap: 1.5, fontSize: 13, py: 1 }}>
              <Animation fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontWeight: exportFormat === 'webp' ? 'bold' : 'normal' }}>导出 WebP</Typography>
            </MenuItem>
            <MenuItem onClick={() => handleSelectFormat('apng')} selected={exportFormat === 'apng'} sx={{ gap: 1.5, fontSize: 13, py: 1 }}>
              <BurstMode fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontWeight: exportFormat === 'apng' ? 'bold' : 'normal' }}>导出 APNG</Typography>
            </MenuItem>
            <MenuItem onClick={() => handleSelectFormat('livephoto')} selected={exportFormat === 'livephoto'} sx={{ gap: 1.5, fontSize: 13, py: 1 }}>
              <PhotoLibrary fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontWeight: exportFormat === 'livephoto' ? 'bold' : 'normal' }}>Live Photo</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Scrollable Configuration Panel */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>

        {/* Settings Panel */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                {originalWidth > 1000 && (
                  <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5, fontSize: 10, lineHeight: 1.4 }}>
                    ⚠️ 提示：原始视频分辨率过大（{originalWidth}px），建议限制宽度在 600px 左右，以契合平台限制，并防止内存占用过高导致预览区空白。
                  </Typography>
                )}
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
                <>
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

                  <Divider sx={{ my: 1, borderColor: 'divider' }} />
                  
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                    GIF 智能压缩微调
                  </Typography>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">优化级别 (Optimize Level)</Typography>
                    </Box>
                    <Select
                      size="small"
                      fullWidth
                      value={optimizeLevel}
                      onChange={(e) => setOptimizeLevel(Number(e.target.value))}
                      sx={{ borderRadius: 1 }}
                      disabled={disabled}
                    >
                      <MenuItem value={1}>O1: 快速 (仅保留变化部分)</MenuItem>
                      <MenuItem value={2}>O2: 均衡 (启发式压缩)</MenuItem>
                      <MenuItem value={3}>O3: 极致 (穷举优化，速度慢)</MenuItem>
                    </Select>
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">色彩数量 (Color Palette)</Typography>
                      <Chip label={`${colors} 色`} size="small" sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 'bold', height: 22, borderRadius: 1 }} />
                    </Box>
                    <Slider value={colors} onChange={(_, v) => setColors(v as number)} min={2} max={256} disabled={disabled} />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">损耗率 (Lossy Compression)</Typography>
                      <Chip label={`水平色彩混叠: ${lossy}`} size="small" sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 'bold', height: 22, borderRadius: 1 }} />
                    </Box>
                    <Slider value={lossy} onChange={(_, v) => setLossy(v as number)} min={0} max={200} disabled={disabled} />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">自动裁剪透明边缘 (Auto-Crop)</Typography>
                    <Switch checked={cropTransparency} onChange={(e) => setCropTransparency(e.target.checked)} size="small" color="primary" disabled={disabled} />
                  </Box>
                </>
              )}
            </>
          )}


        </Box>

        {/* 画面效果微调 (Effects) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Divider sx={{ mb: 1, borderColor: 'divider' }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
            画面效果微调 (Effects)
          </Typography>

          {/* Clarity Slider */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">清晰度 (Clarity)</Typography>
              <Chip 
                label={clarity === 0 ? '无' : `+${clarity}%`} 
                size="small" 
                sx={{ 
                  bgcolor: (theme) => clarity === 0 ? 'action.hover' : alpha(theme.palette.success.main, 0.1), 
                  color: clarity === 0 ? 'text.secondary' : 'success.main', 
                  fontWeight: 'bold', 
                  height: 22, 
                  borderRadius: 1 
                }} 
              />
            </Box>
            <Slider 
              value={clarity} 
              onChange={(_, v) => setClarity(v as number)} 
              min={0} 
              max={100} 
              disabled={disabled}
              color="success"
            />
          </Box>

          {/* Sharpness Slider */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">锐度 (Sharpness)</Typography>
              <Chip 
                label={sharpness === 0 ? '无' : `+${sharpness}%`} 
                size="small" 
                sx={{ 
                  bgcolor: (theme) => sharpness === 0 ? 'action.hover' : alpha(theme.palette.success.main, 0.1), 
                  color: sharpness === 0 ? 'text.secondary' : 'success.main', 
                  fontWeight: 'bold', 
                  height: 22, 
                  borderRadius: 1 
                }} 
              />
            </Box>
            <Slider 
              value={sharpness} 
              onChange={(_, v) => setSharpness(v as number)} 
              min={0} 
              max={100} 
              disabled={disabled}
              color="success"
            />
          </Box>
        </Box>

        {/* 播放顺序 (Playback Order) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Divider sx={{ mb: 1, borderColor: 'divider' }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
            播放顺序 (Playback Order)
          </Typography>
          <ToggleButtonGroup
            value={playMode}
            exclusive
            onChange={(_, val) => val && setPlayMode(val)}
            fullWidth
            size="small"
            disabled={disabled}
            sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', borderRadius: 1 }}
          >
            <ToggleButton value="normal" sx={{ py: 0.5, fontSize: 11 }}>
              顺序播放
            </ToggleButton>
            <ToggleButton value="alternate" sx={{ py: 0.5, fontSize: 11 }}>
              来回播放
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Live Photo 说明 (moved to bottom) */}
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

        {/* Smart Compress Card - GIF only (moved to bottom) */}
        {exportFormat === 'gif' && (
          <Paper sx={{ 
            p: 3, 
            borderRadius: 2,
            background: (theme) => `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
            border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            flexShrink: 0,
            mt: 1
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoFixHigh sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography sx={{ fontWeight: 'bold' }} color="text.primary">微信 / 一键智能 {targetMB}MB</Typography>
              </Box>
              <Chip label="常用推荐" size="small" sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 'bold', fontSize: 10, height: 20, borderRadius: 1 }} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3, lineHeight: 1.6 }}>
              智能转换并并发测试，极速寻找最佳参数组合，确保输出 GIF 严格小于 {targetMB}MB。
            </Typography>
            <Button 
              fullWidth 
              variant="contained" 
              startIcon={<AutoFixHigh />} 
              onClick={onSmartCompress}
              disabled={disabled || loading}
              sx={{ py: 1.5, borderRadius: 2 }}
            >
              智能并发转换并压缩至 {targetMB}MB 内
            </Button>
          </Paper>
        )}

      </Box>

      {/* Sticky Footer with Action Button */}
      <Box sx={{ 
        p: 3, 
        pt: 2, 
        pb: 2.5, 
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        flexShrink: 0
      }}>
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
      </Box>
    </Box>
  );
}
