import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, IconButton,
  Grid, Chip, Divider, Card, CardContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import PaymentIcon from '@mui/icons-material/Payment';
import GroupIcon from '@mui/icons-material/Group';
import InfoIcon from '@mui/icons-material/Info';

const DetailPendaftaranDialog = ({ open, onClose, data }) => {
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
          Detail Pendaftaran Siswa
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: '#f5f5f5', p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Section Status & Metadata */}
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
                <Grid item xs={12} sm={4}>
                  <DetailItem label="ID Gelombang" value={data.idGelombang} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <DetailItem label="Document ID" value={data.id} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <DetailItem label="Cabang Office" value={data.cabangOffice} />
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
                  <DetailItem label="Nomor Pendaftaran" value={data.nomorPendaftaran} highlight />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="Tanggal Daftar" value={data.tglDaftar} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="Nama Lengkap" value={data.namaPendaftar} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="Nomor WhatsApp" value={data.nomorWA} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem label="Email" value={data.email} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem label="Asal Sekolah" value={data.asalSekolah} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem label="Cabang Office" value={data.cabangOffice} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Section Informasi Akademik */}
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Informasi Akademik
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="Jurusan" value={data.jurusan} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="Biaya Jurusan" value={formatCurrency(data.biayaJurusan)} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="Jalur Pendaftaran" value={data.jalurPendaftaran} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="Sumber Informasi" value={data.sumberInformasi} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Section Informasi Pembayaran */}
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PaymentIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Informasi Pembayaran
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="Biaya Pendaftaran" value={formatCurrency(data.biayaPendaftaran)} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="Total Biaya Pendaftaran" value={formatCurrency(data.totalBiayaPendaftaran)} highlight />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="Jenis Potongan" value={data.jenisPotongan || 'Tanpa Potongan'} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DetailItem label="Jumlah Potongan" value={formatCurrency(data.jumlahPotongan)} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem label="Total Biaya Jurusan" value={formatCurrency(data.totalBiayaJurusan)} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem label="Cara Pembayaran" value={data.caraDaftar} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DetailItem label="No. Kwitansi" value={data.noKwitansi} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Section Presenter & Keterangan */}
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Presenter & Informasi Tambahan
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Presenter
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {formatPresenter(data.presenter).map((presenter, index) => (
                      <Chip
                        key={index}
                        label={presenter}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mb: 0.5 }}
                      />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Keterangan
                  </Typography>
                  <Typography variant="body2">
                    {data.ket || 'Tidak ada keterangan'}
                  </Typography>
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

export default DetailPendaftaranDialog;
