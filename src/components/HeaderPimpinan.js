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
import PeopleIcon from '@mui/icons-material/People';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import { Article, HowToReg, Settings } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { AuthContext } from '../context/AuthContext';

const HeaderPimpinan = () => {
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorUser, setAnchorUser] = useState(null);
  const [anchorPendaftaran, setAnchorPendaftaran] = useState(null);
  const [anchorData, setAnchorData] = useState(null);
  const [anchorRekapitulasi, setAnchorRekapitulasi] = useState(null);
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
    navigate('/login-pimpinan');
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
              Dashboard Pimpinan
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
        <ListItem button onClick={() => handleMobileNavigate('/pimpinan/dashboard')}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>

        {/* User Menu */}
        <ListItem button onClick={() => handleMobileMenuToggle('user')}>
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="User" />
          {expandedMobile.user ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItem>
        <Collapse in={expandedMobile.user} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem button sx={{ pl: 4 }} onClick={() => handleMobileNavigate('/pimpinan/tambah-user')}>
              <ListItemText primary="Tambah User" />
            </ListItem>
            <ListItem button sx={{ pl: 4 }} onClick={() => handleMobileNavigate('/pimpinan/data-presenter')}>
              <ListItemText primary="Presenter" />
            </ListItem>
          </List>
        </Collapse>

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
            <ListItem sx={{ pl: 4 }}>
              <ListItemText primary="Mahasiswa Baru" primaryTypographyProps={{ variant: 'subtitle2', color: 'primary.main', fontWeight: 'bold' }} />
            </ListItem>
            <ListItem button sx={{ pl: 6 }} onClick={() => handleMobileNavigate('/pimpinan/pendaftaran-siswa')}>
              <ListItemIcon sx={{ minWidth: 30 }}>
                <SchoolIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Pendaftaran Siswa" />
            </ListItem>
            <ListItem sx={{ pl: 4 }}>
              <ListItemText primary="Mahasiswa Lama" primaryTypographyProps={{ variant: 'subtitle2', color: 'primary.main', fontWeight: 'bold' }} />
            </ListItem>
            <ListItem button sx={{ pl: 6 }} onClick={() => handleMobileNavigate('/pimpinan/daftar-ulang')}>
              <ListItemIcon sx={{ minWidth: 30 }}>
                <HowToReg fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Daftar Ulang" />
            </ListItem>
          </List>
        </Collapse>

        {/* Data Menu */}
        <ListItem button onClick={() => handleMobileMenuToggle('data')}>
          <ListItemIcon>
            <Settings />
          </ListItemIcon>
          <ListItemText primary="Data" />
          {expandedMobile.data ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItem>
        <Collapse in={expandedMobile.data} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem button sx={{ pl: 4 }} onClick={() => handleMobileNavigate('/pimpinan/data-jurusan')}>
              <ListItemText primary="Data Jurusan (Legacy)" />
            </ListItem>
            <ListItem button sx={{ pl: 4 }} onClick={() => handleMobileNavigate('/pimpinan/daftar-jurusan')}>
              <ListItemText primary="Daftar Jurusan" />
            </ListItem>
            <ListItem button sx={{ pl: 4 }} onClick={() => handleMobileNavigate('/pimpinan/biaya-jurusan')}>
              <ListItemText primary="Biaya Jurusan" />
            </ListItem>
            <ListItem button sx={{ pl: 4 }} onClick={() => handleMobileNavigate('/pimpinan/metode-bayar')}>
              <ListItemText primary="Metode Bayar" />
            </ListItem>
            <ListItem button sx={{ pl: 4 }} onClick={() => handleMobileNavigate('/pimpinan/tambah-kantor')}>
              <ListItemText primary="Kantor Cabang" />
            </ListItem>
            <ListItem button sx={{ pl: 4 }} onClick={() => handleMobileNavigate('/pimpinan/tambah-potongan-biaya')}>
              <ListItemText primary="Tambah Potongan Biaya" />
            </ListItem>
            <ListItem button sx={{ pl: 4 }} onClick={() => handleMobileNavigate('/pimpinan/tambah-biaya-pendaftaran')}>
              <ListItemText primary="Tambah Biaya Pendaftaran" />
            </ListItem>
            <ListItem button sx={{ pl: 4 }} onClick={() => handleMobileNavigate('/pimpinan/tambah-jalur-pendaftaran')}>
              <ListItemText primary="Tambah Jalur Pendaftaran" />
            </ListItem>
            <ListItem button sx={{ pl: 4 }} onClick={() => handleMobileNavigate('/pimpinan/tambah-sumber-informasi')}>
              <ListItemText primary="Sumber Informasi" />
            </ListItem>
          </List>
        </Collapse>

        {/* Rekapitulasi Menu */}
        <ListItem button onClick={() => handleMobileMenuToggle('rekapitulasi')}>
          <ListItemIcon>
            <Article />
          </ListItemIcon>
          <ListItemText primary="Rekapitulasi" />
          {expandedMobile.rekapitulasi ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItem>
        <Collapse in={expandedMobile.rekapitulasi} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem button sx={{ pl: 4 }} onClick={() => handleMobileNavigate('/pimpinan/statistik-presenter')}>
              <ListItemText primary="Statistik Presenter" />
            </ListItem>
            <ListItem button sx={{ pl: 4 }} onClick={() => handleMobileNavigate('/pimpinan/statistik-kantor-cabang')}>
              <ListItemText primary="Statistik Kantor Cabang" />
            </ListItem>
            <ListItem button sx={{ pl: 4 }} onClick={() => handleMobileNavigate('/pimpinan/rekap-mahasiswa-baru')}>
              <ListItemText primary="Rekap Mahasiswa Baru" />
            </ListItem>
          </List>
        </Collapse>

        <Divider sx={{ my: 2 }} />

        {/* Profile */}
        <ListItem button onClick={() => handleMobileNavigate('/pimpinan/profile')}>
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
            <Typography variant="h6">Dashboard Pimpinan</Typography>
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
              <Button color="inherit" startIcon={<DashboardIcon />} onClick={() => navigate('/pimpinan/dashboard')}>
                Dashboard
              </Button>

              {/* User */}
              <Button
                color="inherit"
                startIcon={<PeopleIcon />}
                endIcon={<ExpandMoreIcon />}
                onClick={(e) => setAnchorUser(e.currentTarget)}
              >
                User
              </Button>
              <Menu anchorEl={anchorUser} open={Boolean(anchorUser)} onClose={() => setAnchorUser(null)}>
                <MenuItem onClick={() => { setAnchorUser(null); navigate('/pimpinan/tambah-user'); }}>
                  Tambah User
                </MenuItem>
                <MenuItem onClick={() => { setAnchorUser(null); navigate('/pimpinan/data-presenter'); }}>
                  Presenter
                </MenuItem>
              </Menu>

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
                <Typography variant="subtitle2" sx={{ px: 2, pt: 1, fontWeight: 'bold', color: 'primary.main' }}>
                  Mahasiswa Baru
                </Typography>
                <MenuItem onClick={() => {
                  setAnchorPendaftaran(null);
                  navigate('/pimpinan/pendaftaran-siswa');
                }}>
                  <SchoolIcon fontSize="small" style={{ marginRight: 8 }} />
                  Pendaftaran Siswa
                </MenuItem>
                <Divider />
                <Typography variant="subtitle2" sx={{ px: 2, pt: 1, fontWeight: 'bold', color: 'primary.main' }}>
                  Mahasiswa Lama
                </Typography>
                <MenuItem onClick={() => {
                  setAnchorPendaftaran(null);
                  navigate('/pimpinan/daftar-ulang');
                }}>
                  <HowToReg fontSize="small" style={{ marginRight: 8 }} />
                  Daftar Ulang
                </MenuItem>
              </Menu>

              {/* Rekapitulasi */}
              <Button
                color="inherit"
                startIcon={<Article />}
                endIcon={<ExpandMoreIcon />}
                onClick={(e) => setAnchorRekapitulasi(e.currentTarget)}
              >
                Rekapitulasi
              </Button>
              <Menu
                anchorEl={anchorRekapitulasi}
                open={Boolean(anchorRekapitulasi)}
                onClose={() => setAnchorRekapitulasi(null)}
              >
                <MenuItem onClick={() => { setAnchorRekapitulasi(null); navigate('/pimpinan/statistik-presenter'); }}>
                  Statistik Presenter
                </MenuItem>
                <MenuItem onClick={() => { setAnchorRekapitulasi(null); navigate('/pimpinan/statistik-kantor-cabang'); }}>
                  Statistik Kantor Cabang
                </MenuItem>
                <MenuItem onClick={() => { setAnchorRekapitulasi(null); navigate('/pimpinan/rekap-mahasiswa-baru'); }}>
                  Rekap Mahasiswa Baru
                </MenuItem>
              </Menu>

              {/* Data */}
              <Button
                color="inherit"
                startIcon={<Settings />}
                endIcon={<ExpandMoreIcon />}
                onClick={(e) => setAnchorData(e.currentTarget)}
              >
                Data
              </Button>
              <Menu anchorEl={anchorData} open={Boolean(anchorData)} onClose={() => setAnchorData(null)}>
                <MenuItem onClick={() => { setAnchorData(null); navigate('/pimpinan/data-jurusan'); }}>
                  Data Jurusan (Legacy)
                </MenuItem>
                <MenuItem onClick={() => { setAnchorData(null); navigate('/pimpinan/daftar-jurusan'); }}>
                  Daftar Jurusan
                </MenuItem>
                <MenuItem onClick={() => { setAnchorData(null); navigate('/pimpinan/biaya-jurusan'); }}>
                  Biaya Jurusan
                </MenuItem>
                <MenuItem onClick={() => { setAnchorData(null); navigate('/pimpinan/tambah-kantor'); }}>
                  Tambah Kantor
                </MenuItem>
                <MenuItem onClick={() => { setAnchorData(null); navigate('/pimpinan/tambah-gelombang'); }}>
                  Tambah Gelombang
                </MenuItem>
                <MenuItem onClick={() => { setAnchorData(null); navigate('/pimpinan/metode-bayar'); }}>
                  Metode Bayar
                </MenuItem>
                <MenuItem onClick={() => { setAnchorData(null); navigate('/pimpinan/tambah-potongan-biaya'); }}>
                  Tambah Potongan Biaya
                </MenuItem>
                <MenuItem onClick={() => { setAnchorData(null); navigate('/pimpinan/tambah-biaya-pendaftaran'); }}>
                  Tambah Biaya Pendaftaran
                </MenuItem>
                <MenuItem onClick={() => { setAnchorData(null); navigate('/pimpinan/tambah-jalur-pendaftaran'); }}>
                  Tambah Jalur Pendaftaran
                </MenuItem>
                <MenuItem onClick={() => { setAnchorData(null); navigate('/pimpinan/tambah-sumber-informasi'); }}>
                  Sumber Informasi
                </MenuItem>
              </Menu>

              {/* Profile */}
              <Button color="inherit" startIcon={<AccountCircleIcon />} onClick={() => navigate('/pimpinan/profile')}>
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

export default HeaderPimpinan;
