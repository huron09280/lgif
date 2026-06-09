import { Box, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton } from '@mui/material';
import { Tune, LightMode, DarkMode, Movie } from '@mui/icons-material';
import { useColorMode } from '../theme/ThemeContext';
import logoImg from '../assets/logo.png';

interface SidebarProps {
  activeTab: 'compress' | 'videoToGif';
  onTabChange: (tab: 'compress' | 'videoToGif') => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { mode, toggleColorMode } = useColorMode();

  return (
    <Box sx={{ 
      width: 260, 
      bgcolor: 'background.paper', 
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0
    }}>
      <Box 
        style={{ WebkitAppRegion: 'drag' } as any}
        sx={{ 
          height: 60, 
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 3,
          pt: 2
        }}
      >
        <Box 
          component="img"
          src={logoImg} 
          alt="Logo" 
          sx={{ 
            width: 24, 
            height: 24, 
            borderRadius: 1, 
            objectFit: 'cover',
            filter: (theme) => theme.palette.mode === 'dark' ? 'invert(0.9) brightness(1.5)' : 'none'
          }} 
        />
        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
          LGif
        </Typography>
      </Box>

      <Box sx={{ px: 3, pb: 2, pt: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
          功能菜单
        </Typography>
      </Box>

      <List sx={{ px: 2, flex: 1 }}>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton 
            selected={activeTab === 'compress'} 
            onClick={() => onTabChange('compress')}
            sx={{ 
              borderRadius: 3, 
              color: activeTab === 'compress' ? 'white' : 'text.secondary',
              bgcolor: activeTab === 'compress' ? 'primary.main' : 'transparent',
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <Tune />
            </ListItemIcon>
            <ListItemText primary={<Typography variant="body2" sx={{ fontWeight: 600, color: 'inherit' }}>文件智能压缩</Typography>} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton 
            selected={activeTab === 'videoToGif'} 
            onClick={() => onTabChange('videoToGif')}
            sx={{ 
              borderRadius: 3, 
              color: activeTab === 'videoToGif' ? 'white' : 'text.secondary',
              bgcolor: activeTab === 'videoToGif' ? 'primary.main' : 'transparent',
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <Movie />
            </ListItemIcon>
            <ListItemText primary={<Typography variant="body2" sx={{ fontWeight: 600, color: 'inherit' }}>视频/LivePhoto转GIF</Typography>} />
          </ListItemButton>
        </ListItem>
      </List>

      <Box sx={{ px: 3, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'bold' }}>
          外观主题
        </Typography>
        <IconButton 
          onClick={toggleColorMode} 
          color="inherit" 
          size="small" 
          sx={{ 
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', 
            '&:hover': { bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } 
          }}
        >
          {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
        </IconButton>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'bold' }} gutterBottom>
          本地隐私保护
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
          所有 GIF 解析、重绘与压缩流程完全在您 Mac 本地的 Web Worker 中独立运行，文件绝不上传服务器。
        </Typography>
      </Box>
    </Box>
  );
}
