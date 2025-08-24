import React, { useContext, useEffect, useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box,
  Stack, Menu, MenuItem, Divider, IconButton,
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  Collapse, useMediaQuery, useTheme
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import BarChartIcon from '@mui/icons-material/BarChart';
import { HowToReg } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { AuthContext } from '../context/AuthContext';

const HeaderPresenter = () => {
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorPendaftaran, setAnchorPendaftaran] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState({});
  const [dateTime, setDateTime] = useState('');

  const formatDateTime = () => {
    const now = new Date();
    const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][now.getDay()];
    const tanggal = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const jam = now.toLocaleTimeString('id-ID', { hour12: false });
    return `${hari}, ${tanggal} - ${jam}`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(formatDateTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleMobileMenuToggle = (section) => {
    setExpandedMobile(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleMobileNavigate = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const renderMobileMenu = () => (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          pt: 2
        }
      }}
    >
      <List>
        {/* User Info */}
        <ListItem>
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography variant="h6" color="primary">
              Dashboard Presenter
            </Typography>
            {userData && (
              <Typography variant="body2" color="text.secondary">
                {userData.namaLengkap}
              </Typography>
            )}
          </Box>
        </ListItem>
        <Divider />

        {/* Dashboard */}
        <ListItem button onClick={() => handleMobileNavigate('/presenter/dashboard')}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>

        {/* Pendaftaran Menu */}
        <ListItem button onClick={() => handleMobileMenuToggle('pendaftaran')}>
          <ListItemIcon>
            <AssignmentIcon />
          </ListItemIcon>
          <ListItemText primary="Pendaftaran" />
          {expandedMobile.pendaftaran ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItem>
        <Collapse in={expandedMobile.pendaftaran} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem button sx={{ pl: 4 }} onClick={() => handleMobileNavigate('/presenter/pendaftaran-siswa')}>
              <ListItemIcon sx={{ minWidth: 30 }}>
                <SchoolIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Pendaftaran Siswa" />
            </ListItem>
            <ListItem button sx={{ pl: 4 }} onClick={() => handleMobileNavigate('/presenter/daftar-ulang')}>
              <ListItemIcon sx={{ minWidth: 30 }}>
                <HowToReg fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Daftar Ulang" />
            </ListItem>
          </List>
        </Collapse>

        {/* Statistik */}
        <ListItem button onClick={() => handleMobileNavigate('/presenter/statistik')}>
          <ListItemIcon>
            <BarChartIcon />
          </ListItemIcon>
          <ListItemText primary="Statistik" />
        </ListItem>

        <Divider sx={{ my: 2 }} />

        {/* Profile */}
        <ListItem button onClick={() => handleMobileNavigate('/presenter/profile')}>
          <ListItemIcon>
            <AccountCircleIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItem>

        {/* Logout */}
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Drawer>
  );

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Kiri: Judul dan identitas user */}
          <Box>
            <Typography variant="h6">Dashboard Presenter</Typography>
            {userData && !isMobile && (
              <Typography variant="body2">
                {userData.namaLengkap} ({userData.role})
              </Typography>
            )}
          </Box>

          {/* Desktop Menu */}
          {!isMobile ? (
            <Stack direction="row" spacing={2} alignItems="center">
              {/* Tanggal dan jam - Hide on smaller screens */}
              <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', lg: 'block' } }}>
                {dateTime}
              </Typography>

              {/* Dashboard */}
              <Button color="inherit" startIcon={<DashboardIcon />} onClick={() => navigate('/presenter/dashboard')}>
                Dashboard
              </Button>

              {/* Pendaftaran */}
              <Button
                color="inherit"
                startIcon={<AssignmentIcon />}
                endIcon={<ExpandMoreIcon />}
                onClick={(e) => setAnchorPendaftaran(e.currentTarget)}
              >
                Pendaftaran
              </Button>
              <Menu anchorEl={anchorPendaftaran} open={Boolean(anchorPendaftaran)} onClose={() => setAnchorPendaftaran(null)}>
                <MenuItem onClick={() => {
                  setAnchorPendaftaran(null);
                  navigate('/presenter/pendaftaran-siswa');
                }}>
                  <SchoolIcon fontSize="small" style={{ marginRight: 8 }} />
                  Pendaftaran Siswa
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => {
                  setAnchorPendaftaran(null);
                  navigate('/presenter/daftar-ulang');
                }}>
                  <HowToReg fontSize="small" style={{ marginRight: 8 }} />
                  Daftar Ulang
                </MenuItem>
              </Menu>

              {/* Statistik */}
              <Button color="inherit" startIcon={<BarChartIcon />} onClick={() => navigate('/presenter/statistik')}>
                Statistik
              </Button>

              {/* Profile */}
              <Button color="inherit" startIcon={<AccountCircleIcon />} onClick={() => navigate('/presenter/profile')}>
                Profile
              </Button>

              {/* Logout */}
              <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
                Logout
              </Button>
            </Stack>
          ) : (
            /* Mobile Menu Button */
            <IconButton
              color="inherit"
              edge="end"
              onClick={() => setMobileMenuOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Menu Drawer */}
      {renderMobileMenu()}
    </>
  );
};

export default HeaderPresenter;
