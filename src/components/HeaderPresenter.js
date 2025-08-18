import React, { useContext, useEffect, useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box,
  Stack, Menu, MenuItem, Divider
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';
import BarChartIcon from '@mui/icons-material/BarChart';
import { HowToReg } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { AuthContext } from '../context/AuthContext';

const HeaderPresenter = () => {
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  const [anchorPendaftaran, setAnchorPendaftaran] = useState(null);
  const [anchorRekapitulasi, setAnchorRekapitulasi] = useState(null);
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
    navigate('/login-presenter');
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Kiri: Judul dan identitas user */}
        <Box>
          <Typography variant="h6">Dashboard Presenter</Typography>
          {userData && (
            <Typography variant="body2">
              {userData.namaLengkap} ({userData.role})
            </Typography>
          )}
        </Box>

        {/* Kanan: Navigasi menu */}
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Tanggal dan jam */}
          <Typography variant="body2" sx={{ mr: 2 }}>{dateTime}</Typography>

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
            <Typography variant="subtitle2" sx={{ px: 2, pt: 1, fontWeight: 'bold', color: 'primary.main' }}>
              Mahasiswa Baru
            </Typography>
            <MenuItem onClick={() => {
              setAnchorPendaftaran(null);
              navigate('/presenter/pendaftaran-siswa');
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
              navigate('/presenter/daftar-ulang');
            }}>
              <HowToReg fontSize="small" style={{ marginRight: 8 }} />
              Daftar Ulang
            </MenuItem>
          </Menu>

          {/* Rekapitulasi */}
          <Button
            color="inherit"
            startIcon={<BarChartIcon />}
            endIcon={<ExpandMoreIcon />}
            onClick={(e) => setAnchorRekapitulasi(e.currentTarget)}
          >
            Rekapitulasi
          </Button>
          <Menu anchorEl={anchorRekapitulasi} open={Boolean(anchorRekapitulasi)} onClose={() => setAnchorRekapitulasi(null)}>
            <MenuItem onClick={() => {
              setAnchorRekapitulasi(null);
              navigate('/presenter/statistik');
            }}>
              <BarChartIcon fontSize="small" style={{ marginRight: 8 }} />
              Statistik Presenter
            </MenuItem>
          </Menu>

          {/* Logout */}
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
            Logout
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default HeaderPresenter;
