import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

interface ImageSliderProps {
  originalSrc: string;
  compressedSrc: string;
}

export default function ImageSlider({ originalSrc, compressedSrc }: ImageSliderProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const [originalLoaded, setOriginalLoaded] = useState(false);
  const [compressedLoaded, setCompressedLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset loaded states when sources change
  useEffect(() => {
    setOriginalLoaded(false);
    setCompressedLoaded(false);
  }, [originalSrc, compressedSrc]);

  const isLoaded = originalLoaded && compressedLoaded;

  const handleDrag = (e: any) => {
    if (!containerRef.current) return;
    let clientX = 0;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
    } else if (e.clientX !== undefined) {
      clientX = e.clientX;
    } else {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    handleDrag(e);
    const moveHandler = (moveEvent: MouseEvent | TouchEvent) => handleDrag(moveEvent);
    const upHandler = () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
      document.removeEventListener('touchend', upHandler);
    };
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('touchmove', moveHandler);
    document.addEventListener('mouseup', upHandler);
    document.addEventListener('touchend', upHandler);
  };

  return (
    <Box 
      ref={containerRef}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        cursor: 'col-resize',
        overflow: 'hidden',
        userSelect: 'none',
        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0a0a0c' : '#F3F4F6',
        borderRadius: 2
      }}
    >
      {/* Compressed Image (Background) */}
      <Box 
        component="img"
        src={compressedSrc}
        onLoad={() => setCompressedLoaded(true)}
        onError={() => setCompressedLoaded(true)}
        sx={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'contain',
          visibility: isLoaded ? 'visible' : 'hidden'
        }}
      />

      {/* Original Image (Foreground, Clipped) */}
      <Box 
        component="img"
        src={originalSrc}
        onLoad={() => setOriginalLoaded(true)}
        onError={() => setOriginalLoaded(true)}
        sx={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'contain',
          clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
          visibility: isLoaded ? 'visible' : 'hidden'
        }}
      />

      {/* Image Loading Overlay */}
      {!isLoaded && (
        <Box sx={{ 
          position: 'absolute', inset: 0, 
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(20,20,25,0.85)' : 'rgba(255,255,255,0.85)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 9 
        }}>
          <CircularProgress size={60} thickness={4} />
        </Box>
      )}

      {/* Slider Line */}
      <Box sx={{
        position: 'absolute', top: 0, bottom: 0, left: `${sliderPos}%`,
        width: 2, bgcolor: '#A77DFA', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {/* Slider Handle */}
        <Box sx={{
          width: 32, height: 32, borderRadius: '50%', bgcolor: '#A77DFA',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 10px rgba(0,0,0,0.3)'
        }}>
          <Box sx={{ width: 2, height: 12, bgcolor: '#fff', mx: 0.5, borderRadius: 1 }} />
          <Box sx={{ width: 2, height: 12, bgcolor: '#fff', mx: 0.5, borderRadius: 1 }} />
        </Box>
      </Box>

      {/* Labels */}
      <Box sx={{ 
        position: 'absolute', bottom: 16, left: 16, px: 2, py: 0.5, 
        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30,30,36,0.85)' : 'rgba(255,255,255,0.85)', 
        borderRadius: 1, 
        backdropFilter: 'blur(10px)', 
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Typography variant="caption" color="text.primary" sx={{ fontWeight: 'bold' }}>原始图片</Typography>
      </Box>
      <Box sx={{ 
        position: 'absolute', bottom: 16, right: 16, px: 2, py: 0.5, 
        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30,30,36,0.85)' : 'rgba(255,255,255,0.85)', 
        borderRadius: 1, 
        backdropFilter: 'blur(10px)', 
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Typography variant="caption" color="text.primary" sx={{ fontWeight: 'bold' }}>压缩后</Typography>
      </Box>
    </Box>
  );
}
