import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, IconButton,
  Grid, Chip, Divider, Card, CardContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import InfoIcon from '@mui/icons-material/Info';
import RestoreIcon from '@mui/icons-material/Restore';

const DetailDataDialog = ({ open, onClose, data }) => {
  if (!data) return null;

  // Helper fungsi untuk format currency
  const formatCurrency = (value) => {
    if (!value) return '-';
    const numericValue = typeof value === 'string' && value.includes('.')
      ? parseInt(value.replace(/\./g, ''))
      : parseInt(value);
    return `Rp ${numericValue.toLocaleString('id-ID')}`;
  };

  // Helper fungsi untuk format array presenter
  const formatPresenter = (presenter) => {
    if (!presenter) return '-';
    if (Array.isArray(presenter)) {
      return presenter.length > 0 ? presenter : ['-'];
    }
    return [presenter];
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: 'primary.main',
        color: 'white',
        mb: 2
      }}>
        <Typography variant="h6" component="div">
          Detail Data Daftar Ulang
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: '#f5f5f5', p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Section Informasi Sistem */}
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Informasi Sistem
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem label="Nomor Pendaftaran" value={data.nomorPendaftaran} highlight />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem label="Input Oleh" value={data.inputBy || data.cabangOffice} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem label="Document ID" value={data.id} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Section Informasi Pendaftar */}
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Informasi Pendaftar
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="Nama Lengkap" value={data.namaPendaftar} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="Nomor WhatsApp" value={data.nomorWA} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="Email" value={data.email} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="Jenis Kelamin" value={data.jenisKelamin} />
                </Grid>
                <Grid item xs={12} sm={6} md={6}>
                  <DetailItem label="Asal Sekolah" value={data.asalSekolah} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="Jurusan" value={data.jurusan} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="Ukuran Kaos" value={data.ukuranKaos} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Section Informasi Daftar Ulang */}
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <RestoreIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Informasi Daftar Ulang
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="DU Tahap 1" value={data.duTahap1 ? formatCurrency(data.duTahap1) : '-'} highlight />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="Tanggal DU Tahap 1" value={data.tglDU1} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="DU Tahap 2" value={data.duTahap2 ? formatCurrency(data.duTahap2) : '-'} highlight />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="Tanggal DU Tahap 2" value={data.tglDU2} />
                </Grid>
                <Grid item xs={12} sm={6} md={6}>
                  <DetailItem label="Cara Daftar" value={data.caraDaftar} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Section Presenter */}
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Informasi Presenter
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Presenter yang Ditugaskan
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formatPresenter(data.presenter).map((presenter, index) => (
                      <Chip
                        key={index}
                        label={presenter}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

        </Box>
      </DialogContent>
    </Dialog>
  );
};

const DetailItem = ({ label, value, highlight = false }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography
      variant="subtitle2"
      color="text.secondary"
      sx={{ fontWeight: highlight ? 'bold' : 'normal' }}
    >
      {label}
    </Typography>
    <Typography
      variant="body1"
      sx={{
        fontWeight: highlight ? 'bold' : 'normal',
        color: highlight ? 'primary.main' : 'text.primary'
      }}
    >
      {value || '-'}
    </Typography>
  </Box>
);

export default DetailDataDialog;
