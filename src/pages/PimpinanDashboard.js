import React from 'react';
import { Box, Typography } from '@mui/material';
import HeaderPimpinan from '../components/HeaderPimpinan';

const PimpinanDashboard = () => {
  return (
    <Box>
      <HeaderPimpinan />
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Selamat Datang di Dashboard Pimpinan</Typography>
        <Typography>Silakan pilih menu di kanan atas untuk mengelola data pengguna atau pendaftaran.</Typography>
      </Box>
    </Box>
  );
};

export default PimpinanDashboard;