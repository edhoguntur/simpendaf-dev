import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, IconButton, Grid, Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const DetailPendaftaranDialog = ({ open, onClose, data }) => {
  if (!data) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Detail Pendaftaran Siswa
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Kolom kiri */}
          <Grid item xs={12} md={6}>
            <Info label="Nomor Pendaftaran" value={data.nomorPendaftaran} />
            <Info label="Tanggal Daftar" value={data.tglDaftar} />
            <Info label="Nama Pendaftar" value={data.namaPendaftar} />
            <Info label="Nomor WA" value={data.nomorWA} />
            <Info label="Email" value={data.email} />
            <Info label="Asal Sekolah" value={data.asalSekolah} />
          </Grid>

          {/* Kolom kanan */}
          <Grid item xs={12} md={6}>
            <Info label="Jurusan" value={data.jurusan} />
            <Info label="Biaya Pendaftaran" value={data.biayaPendaftaran} />
            <Info label="Jenis Potongan" value={data.jenisPotongan} />
            <Info label="Jumlah Potongan" value={data.jumlahPotongan} />
            <Info label="Total Biaya Pendaftaran" value={data.totalBiayaPendaftaran} />
            <Info label="No Kwitansi" value={data.noKwitansi} />
          </Grid>
          {/* Kolom kanan */}
          <Grid item xs={12} md={6}>
            <Info label="Cara Daftar" value={data.caraDaftar} />
            <Info label="Keterangan" value={data.ket} />
            <Typography fontWeight="bold" sx={{ mt: 2 }}>Presenter:</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {(data.presenter || []).map((p, i) => (
                <Chip key={i} label={p} size="small" color="primary" />
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

const Info = ({ label, value }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
    <Typography variant="body1">{value || '-'}</Typography>
  </Box>
);

export default DetailPendaftaranDialog;
