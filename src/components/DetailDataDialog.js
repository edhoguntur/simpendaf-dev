import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, Grid, Typography, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const DetailDataDialog = ({ open, onClose, data }) => {
  if (!data) return null;

  const renderField = (label, value) => (
    <Grid item xs={12} sm={6}>
      <Typography variant="body2" fontWeight="bold">{label}</Typography>
      <Typography variant="body1">{value || '-'}</Typography>
    </Grid>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        Detail Data
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {renderField('Nomor Pendaftaran', data.nomorPendaftaran)}
          {renderField('Nama Pendaftar', data.namaPendaftar)}
          {renderField('Nomor WA', data.nomorWA)}
          {renderField('Email', data.email)}
          {renderField('Asal Sekolah', data.asalSekolah)}
          {renderField('Jenis Kelamin', data.jenisKelamin)}
          {renderField('Jurusan', data.jurusan)}
          {renderField('Ukuran Kaos', data.ukuranKaos)}
          {/* {renderField('Tanggal Daftar', data.tglDaftar)}
          {renderField('Biaya Pendaftaran', data.biayaPendaftaran)}
          {renderField('No Kwitansi', data.noKwitansi)} */}
          {renderField('Cara Daftar', data.caraDaftar)}
          {/* {renderField('Keterangan', data.ket)}
          {renderField('Cabang Office', data.cabangOffice)} */}
          {renderField('Input Oleh', data.inputBy)}

          {/* Daftar Ulang */}
          {renderField('DU Tahap 1', data.duTahap1)}
          {renderField('Tanggal DU 1', data.tglDU1)}
          {renderField('DU Tahap 2', data.duTahap2)}
          {renderField('Tanggal DU 2', data.tglDU2)}

          {/* Presenter */}
          {Array.isArray(data.presenter) && data.presenter.length > 0
            ? renderField('Presenter', data.presenter.join(', '))
            : renderField('Presenter', data.presenter)}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default DetailDataDialog;
