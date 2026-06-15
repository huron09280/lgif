import { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Slider, Chip, Select, MenuItem, Switch, Divider, alpha, OutlinedInput, InputAdornment, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { AutoFixHigh, Tune, Refresh } from '@mui/icons-material';

interface RightPanelProps {
  exportFormat: 'gif' | 'webp' | 'apng';
  setExportFormat: (v: 'gif' | 'webp' | 'apng') => void;
  targetMB: number;
  setTargetMB: (v: number) => void;
  lossy: number;
  setLossy: (v: number) => void;
  colors: number;
  setColors: (v: number) => void;
  scaleWidth: number;
  setScaleWidth: (v: number) => void;
  originalWidth: number;
  optimizeLevel: number;
  setOptimizeLevel: (v: number) => void;
  dither: boolean;
  setDither: (v: boolean) => void;
  cropTransparency: boolean;
  setCropTransparency: (v: boolean) => void;
  frameRateDivisor: number;
  setFrameRateDivisor: (v: number) => void;
  speedMultiplier: number;
  setSpeedMultiplier: (v: number) => void;
  playMode: 'normal' | 'alternate';
  setPlayMode: (v: 'normal' | 'alternate') => void;
  clarity: number;
  setClarity: (v: number) => void;
  sharpness: number;
  setSharpness: (v: number) => void;
  onSmartCompress: () => void;
  onManualCompress: () => void;
  loading: boolean;
  disabled: boolean;
}

export default function RightPanel({
  exportFormat, setExportFormat,
  targetMB, setTargetMB: _setTargetMB, lossy, setLossy, colors, setColors, scaleWidth, setScaleWidth, originalWidth,
  optimizeLevel, setOptimizeLevel, dither, setDither, cropTransparency, setCropTransparency,
  frameRateDivisor, setFrameRateDivisor, speedMultiplier, setSpeedMultiplier,
  playMode, setPlayMode,
  clarity, setClarity, sharpness, setSharpness,
  onSmartCompress, onManualCompress, loading, disabled
}: RightPanelProps) {
  // 分辨率宽度手动输入状态
  const [widthText, setWidthText] = useState(scaleWidth > 0 ? String(scaleWidth) : '');
  useEffect(() => {
    setWidthText(scaleWidth > 0 ? String(scaleWidth) : '');
  }, [scaleWidth]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setWidthText(valStr);
    const val = parseInt(valStr, 10);
    if (!isNaN(val) && val > 0) {
      setScaleWidth(val);
    }
  };

  const handleWidthBlur = () => {
    const val = parseInt(widthText, 10);
    if (isNaN(val) || val < 50) {
      setScaleWidth(50);
      setWidthText('50');
    } else if (val > originalWidth && originalWidth > 0) {
      setScaleWidth(originalWidth);
      setWidthText(String(originalWidth));
    } else {
      setScaleWidth(val);
      setWidthText(String(val));
    }
  };

  // 播放速度手动输入状态
  const [speedText, setSpeedText] = useState(String(speedMultiplier));
  useEffect(() => {
    setSpeedText(String(speedMultiplier));
  }, [speedMultiplier]);

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setSpeedText(valStr);
    const val = parseFloat(valStr);
    if (!isNaN(val) && val > 0) {
      setSpeedMultiplier(val);
    }
  };

  const handleSpeedBlur = () => {
    const val = parseFloat(speedText);
    if (isNaN(val) || val < 0.1) {
      setSpeedMultiplier(0.1);
      setSpeedText('0.1');
    } else if (val > 20.0) {
      setSpeedMultiplier(20.0);
      setSpeedText('20.0');
    } else {
      setSpeedMultiplier(val);
      setSpeedText(String(val));
    }
  };

  // 降低帧率手动输入与滑动状态
  const [divisorText, setDivisorText] = useState(String(frameRateDivisor));
  useEffect(() => {
    setDivisorText(String(frameRateDivisor));
  }, [frameRateDivisor]);

  const handleDivisorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setDivisorText(valStr);
    const val = parseInt(valStr, 10);
    if (!isNaN(val) && val > 0) {
      setFrameRateDivisor(val);
    }
  };

  const handleDivisorBlur = () => {
    const val = parseInt(divisorText, 10);
    if (isNaN(val) || val < 1) {
      setFrameRateDivisor(1);
      setDivisorText('1');
    } else if (val > 50) {
      setFrameRateDivisor(50);
      setDivisorText('50');
    } else {
      setFrameRateDivisor(val);
      setDivisorText(String(val));
    }
  };

  return (
    <Box sx={{ width: 360, p: 3, display: 'flex', flexDirection: 'column', gap: 4, bgcolor: 'background.paper', overflowY: 'auto' }}>
      
      {/* Format Selection Card */}
      <Paper sx={{ 
        p: 2.5, 
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        flexShrink: 0
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 'bold' }}>
          选择导出格式
        </Typography>
        <ToggleButtonGroup
          value={exportFormat}
          exclusive
          onChange={(_, val) => val && setExportFormat(val)}
          fullWidth
          size="small"
          sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)' }}
        >
          <ToggleButton value="gif" sx={{ py: 0.75, fontSize: 12 }}>
            GIF
          </ToggleButton>
          <ToggleButton value="webp" sx={{ py: 0.75, fontSize: 12 }}>
            WebP
          </ToggleButton>
          <ToggleButton value="apng" sx={{ py: 0.75, fontSize: 12 }}>
            APNG
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {/* Smart Compress Card - GIF only */}
      {exportFormat === 'gif' && (
        <Paper sx={{ 
          p: 3, 
          borderRadius: 2,
          background: (theme) => `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          flexShrink: 0
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoFixHigh sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography sx={{ fontWeight: 'bold' }} color="text.primary">微信 / 一键智能 {targetMB}MB</Typography>
            </Box>
            <Chip label="常用推荐" size="small" sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 'bold', fontSize: 10, height: 20, borderRadius: 1 }} />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3, lineHeight: 1.6 }}>
            智能启动多线程并发测试，极速寻找最佳参数组合，确保输出 GIF 严格小于 {targetMB}MB。
          </Typography>
          <Button 
            fullWidth 
            variant="contained" 
            startIcon={<AutoFixHigh />} 
            onClick={onSmartCompress}
            disabled={disabled || loading}
            sx={{ py: 1.5, borderRadius: 2 }}
          >
            智能并发压缩至 {targetMB}MB 内
          </Button>
        </Paper>
      )}

      {/* Manual Controls */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tune sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Typography sx={{ fontWeight: 'bold' }} color="text.secondary">高级微调面板</Typography>
        </Box>

        {exportFormat === 'gif' && (
          <>
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
              >
                <MenuItem value={1}>O1: 快速 (仅保留变化部分)</MenuItem>
                <MenuItem value={2}>O2: 均衡 (启发式压缩)</MenuItem>
                <MenuItem value={3}>O3: 极致 (穷举优化，速度慢)</MenuItem>
              </Select>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">开启抖动算法 (Floyd-Steinberg Dither)</Typography>
              <Switch checked={dither} onChange={(e) => setDither(e.target.checked)} size="small" color="primary" />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">自动裁剪透明边缘 (Auto-Crop)</Typography>
              <Switch checked={cropTransparency} onChange={(e) => setCropTransparency(e.target.checked)} size="small" color="primary" />
            </Box>

            <Divider sx={{ my: 1, borderColor: 'divider' }} />
          </>
        )}

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">分辨率宽度 (Width)</Typography>
            <OutlinedInput
              size="small"
              value={widthText}
              onChange={handleWidthChange}
              onBlur={handleWidthBlur}
              endAdornment={<InputAdornment position="end" sx={{ '& .MuiTypography-root': { fontSize: 10 } }}>px</InputAdornment>}
              disabled={originalWidth <= 0}
              sx={{ 
                width: 90, 
                height: 24, 
                fontSize: 11, 
                '& .MuiOutlinedInput-input': { p: '2px 6px', textAlign: 'right' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
              }}
            />
          </Box>
          <Slider 
            value={scaleWidth > 0 ? scaleWidth : 100} 
            onChange={(_, v) => setScaleWidth(v as number)} 
            min={50} 
            max={originalWidth > 0 ? originalWidth : 2000} 
            disabled={originalWidth <= 0}
          />
          {originalWidth > 1000 && (
            <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5, fontSize: 10, lineHeight: 1.4 }}>
              ⚠️ 提示：原始分辨率过大（{originalWidth}px），建议限制宽度在 600px 左右，以契合社交平台限制，并防止内存占用过高导致预览区空白。
            </Typography>
          )}
        </Box>

        {exportFormat === 'gif' && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">色彩数量 (Color Palette)</Typography>
              <Chip label={`${colors} 色`} size="small" sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 'bold', height: 22, borderRadius: 1 }} />
            </Box>
            <Slider value={colors} onChange={(_, v) => setColors(v as number)} min={2} max={256} />
          </Box>
        )}

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">降低帧率 (Frame Rate)</Typography>
            <OutlinedInput
              size="small"
              value={divisorText}
              onChange={handleDivisorChange}
              onBlur={handleDivisorBlur}
              endAdornment={<InputAdornment position="end" sx={{ '& .MuiTypography-root': { fontSize: 10 } }}>帧</InputAdornment>}
              disabled={disabled}
              sx={{ 
                width: 70, 
                height: 24, 
                fontSize: 11, 
                '& .MuiOutlinedInput-input': { p: '2px 6px', textAlign: 'right' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
              }}
            />
          </Box>
          <Slider 
            value={frameRateDivisor <= 12 ? frameRateDivisor : 12} 
            onChange={(_, v) => {
              setFrameRateDivisor(v as number);
              setDivisorText(String(v));
            }} 
            min={1} 
            max={12} 
            step={1}
            disabled={disabled}
            marks={[
              { value: 1, label: '1' },
              { value: 2, label: '1/2' },
              { value: 3, label: '1/3' },
              { value: 4, label: '1/4' },
              { value: 8, label: '1/8' },
              { value: 12, label: '1/12' },
            ]}
            sx={{ mx: 0.5 }}
          />
        </Box>

        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">播放速度 (Speed)</Typography>
            <OutlinedInput
              size="small"
              value={speedText}
              onChange={handleSpeedChange}
              onBlur={handleSpeedBlur}
              endAdornment={<InputAdornment position="end" sx={{ '& .MuiTypography-root': { fontSize: 10 } }}>x</InputAdornment>}
              disabled={disabled}
              sx={{ 
                width: 70, 
                height: 24, 
                fontSize: 11, 
                '& .MuiOutlinedInput-input': { p: '2px 6px', textAlign: 'right' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
              }}
            />
          </Box>
          <Slider 
            value={speedMultiplier <= 6.0 ? speedMultiplier : 6.0} 
            onChange={(_, v) => setSpeedMultiplier(v as number)} 
            min={0.5} 
            max={6.0} 
            step={0.1}
            disabled={disabled}
            marks={[
              { value: 0.5, label: '0.5x' },
              { value: 1.0, label: '1.0x' },
              { value: 2.0, label: '2.0x' },
              { value: 4.0, label: '4.0x' },
              { value: 6.0, label: '6.0x' },
            ]}
            sx={{ mx: 0.5 }}
          />
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary">播放顺序 (Playback Order)</Typography>
          </Box>
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

        {exportFormat === 'gif' && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">损耗率 (Lossy Compression)</Typography>
              <Chip label={`水平色彩混叠: ${lossy}`} size="small" sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 'bold', height: 22, borderRadius: 1 }} />
            </Box>
            <Slider value={lossy} onChange={(_, v) => setLossy(v as number)} min={0} max={200} />
          </Box>
        )}

        <Divider sx={{ my: 1.5, borderColor: 'divider' }} />

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

        <Button 
          fullWidth 
          variant="outlined" 
          startIcon={<Refresh />} 
          onClick={onManualCompress}
          disabled={disabled || loading}
          sx={{ 
            py: 1.5, 
            borderRadius: 2, 
            borderColor: 'divider', 
            color: 'text.primary',
            '&:hover': { borderColor: 'primary.main', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) }
          }}
        >
          {exportFormat === 'gif' ? '运行高级手动压缩' : `运行 ${exportFormat.toUpperCase()} 转换`}
        </Button>
      </Box>
    </Box>
  );
}
