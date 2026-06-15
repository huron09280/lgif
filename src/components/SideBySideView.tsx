import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

interface SideBySideViewProps {
  originalSrc: string;
  compressedSrc: string;
}

export default function SideBySideView({ originalSrc, compressedSrc }: SideBySideViewProps) {
  const [originalLoaded, setOriginalLoaded] = useState(false);
  const [compressedLoaded, setCompressedLoaded] = useState(false);

  // Reset loaded states when sources change
  useEffect(() => {
    setOriginalLoaded(false);
    setCompressedLoaded(false);
  }, [originalSrc, compressedSrc]);

  const isLoaded = originalLoaded && compressedLoaded;

  return (
    <Box 
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
        overflow: 'hidden',
        userSelect: 'none',
        bgcolor: 'transparent',
        minHeight: 0
      }}
    >
      {/* Left Pane: Original */}
      <Box 
        sx={{
          flex: 1,
          height: '100%',
          position: 'relative',
          bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0a0a0c' : '#F3F4F6',
          borderRadius: 2,
          overflow: 'hidden',
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box 
          component="img"
          src={originalSrc}
          onLoad={() => setOriginalLoaded(true)}
          onError={() => setOriginalLoaded(true)}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            visibility: isLoaded ? 'visible' : 'hidden'
          }}
        />
        
        {/* Label */}
        {isLoaded && (
          <Box sx={{ 
            position: 'absolute', bottom: 16, left: 16, px: 2, py: 0.5, 
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30,30,36,0.85)' : 'rgba(255,255,255,0.85)', 
            borderRadius: 1, 
            backdropFilter: 'blur(10px)', 
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 2
          }}>
            <Typography variant="caption" color="text.primary" sx={{ fontWeight: 'bold' }}>原始图片</Typography>
          </Box>
        )}
      </Box>

      {/* Right Pane: Compressed */}
      <Box 
        sx={{
          flex: 1,
          height: '100%',
          position: 'relative',
          bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0a0a0c' : '#F3F4F6',
          borderRadius: 2,
          overflow: 'hidden',
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box 
          component="img"
          src={compressedSrc}
          onLoad={() => setCompressedLoaded(true)}
          onError={() => setCompressedLoaded(true)}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            visibility: isLoaded ? 'visible' : 'hidden'
          }}
        />

        {/* Label */}
        {isLoaded && (
          <Box sx={{ 
            position: 'absolute', bottom: 16, right: 16, px: 2, py: 0.5, 
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30,30,36,0.85)' : 'rgba(255,255,255,0.85)', 
            borderRadius: 1, 
            backdropFilter: 'blur(10px)', 
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 2
          }}>
            <Typography variant="caption" color="text.primary" sx={{ fontWeight: 'bold' }}>压缩后</Typography>
          </Box>
        )}
      </Box>

      {/* Image Loading Overlay */}
      {!isLoaded && (
        <Box sx={{ 
          position: 'absolute', inset: 0, 
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(20,20,25,0.85)' : 'rgba(255,255,255,0.85)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 9,
          borderRadius: 2
        }}>
          <CircularProgress size={60} thickness={4} />
        </Box>
      )}
    </Box>
  );
}
