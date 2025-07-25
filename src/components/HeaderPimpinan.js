import React, { useContext, useEffect, useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box,
  Stack, Menu, MenuItem, Divider
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';
import { HowToReg } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { AuthContext } from '../context/AuthContext';

const HeaderPimpinan = () => {
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  const [anchorUser, setAnchorUser] = useState(null);
  const [anchorPendaftaran, setAnchorPendaftaran] = useState(null);
  const [anchorJurusan, setAnchorJurusan] = useState(null);
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

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Kiri: Judul dan identitas user */}
        <Box>
          <Typography variant="h6">Dashboard Pimpinan</Typography>
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
            <MenuItem onClick={() => {
              setAnchorPendaftaran(null);
              navigate('/pimpinan/tambah-gelombang');
            }}>
              Tambah Gelombang
            </MenuItem>
            <MenuItem onClick={() => {
              setAnchorPendaftaran(null);
              navigate('/pimpinan/metode-bayar');
            }}>
              Metode Bayar
            </MenuItem>
            <MenuItem onClick={() => {
              setAnchorPendaftaran(null);
              navigate('/pimpinan/tambah-potongan-biaya');
            }}>
              Tambah Potongan Biaya
            </MenuItem>
            <MenuItem onClick={() => {
              setAnchorPendaftaran(null);
              navigate('/pimpinan/tambah-biaya-pendaftaran');
            }}>
              Tambah Biaya Pendaftaran
            </MenuItem>
            <MenuItem onClick={() => {
              setAnchorPendaftaran(null);
              navigate('/pimpinan/tambah-sumber-informasi');
            }}>
              Sumber Informasi
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => {
              setAnchorPendaftaran(null);
              navigate('/pimpinan/pendaftaran-siswa');
            }}>
              Pendaftaran Siswa
            </MenuItem>
            <MenuItem onClick={() => {
              setAnchorPendaftaran(null);
              navigate('/pimpinan/daftar-ulang');
            }}>
              <HowToReg fontSize="small" style={{ marginRight: 8 }} />
              Daftar Ulang
            </MenuItem>
          </Menu>

          {/* Jurusan */}
          <Button
            color="inherit"
            startIcon={<SchoolIcon />}
            endIcon={<ExpandMoreIcon />}
            onClick={(e) => setAnchorJurusan(e.currentTarget)}
          >
            Jurusan
          </Button>
          <Menu anchorEl={anchorJurusan} open={Boolean(anchorJurusan)} onClose={() => setAnchorJurusan(null)}>
            <MenuItem onClick={() => { setAnchorJurusan(null); navigate('/pimpinan/data-jurusan'); }}>
              Data Jurusan
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

export default HeaderPimpinan;
