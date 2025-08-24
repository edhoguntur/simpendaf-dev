import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  Box, Typography, TextField, MenuItem, Button, Drawer,
  ToggleButton, ToggleButtonGroup, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../context/AuthContext';

const FormDaftarUlang = ({ open, onClose, dataPendaftar, isEditData, fetchDaftarUlang }) => {
  const { userData } = useContext(AuthContext);

  // Helper fungsi untuk currency formatting (konsisten dengan FormPendaftaranSiswa)
  const parseCurrency = useCallback((value) => {
    if (!value) return 0;
    return parseInt(value.toString().replace(/\./g, ''));
  }, []);

  const [form, setForm] = useState({
    nomorPendaftaran: '',
    namaPendaftar: '',
    nomorWA: '',
    email: '',
    jenisKelamin: '',
    asalSekolah: '',
    jurusan: '',
    ukuranKaos: '',
    presenter: [],
    duTahap1: '',
    tglDU1: '',
    duTahap2: '',
    tglDU2: '',
    caraDaftar: ''
  });

  const [presenterList, setPresenterList] = useState([]);
  const [gelombangList, setGelombangList] = useState([]);

  // Helper function untuk filter presenter berdasarkan kantor cabang
  const getAvailablePresenter = useCallback(() => {
    if (!presenterList.length) return [];

    // Gunakan kantor cabang dari data pendaftar atau user yang sedang login
    const kantorCabang = dataPendaftar?.cabangOffice || userData?.cabangOffice;

    // Filter berdasarkan kantor cabang
    // Note: Dalam data presenter, cabang office disimpan di field 'alamat'
    if (kantorCabang) {
      return presenterList.filter(p => p.alamat === kantorCabang);
    }

    // Jika tidak ada kantor cabang, tampilkan semua (untuk pimpinan)
    return presenterList;
  }, [presenterList, dataPendaftar, userData]);

  useEffect(() => {
    if (dataPendaftar) {
      // Validasi permission untuk presenter saat edit
      if (isEditData && userData?.role === 'presenter') {
        // Presenter dapat mengedit data dari cabangOffice yang sama
        if (dataPendaftar.cabangOffice !== userData.cabangOffice) {
          alert('Anda tidak memiliki permission untuk mengedit data ini. Data ini bukan dari cabang office Anda.');
          onClose();
          return;
        }
      }

      setForm({
        nomorPendaftaran: dataPendaftar.nomorPendaftaran || '',
        namaPendaftar: dataPendaftar.namaPendaftar || '',
        nomorWA: dataPendaftar.nomorWA || '',
        email: dataPendaftar.email || '',
        jenisKelamin: dataPendaftar.jenisKelamin || '',
        asalSekolah: dataPendaftar.asalSekolah || '',
        jurusan: dataPendaftar.jurusan || '',
        ukuranKaos: dataPendaftar.ukuranKaos || '',
        presenter: Array.isArray(dataPendaftar.presenter) ? dataPendaftar.presenter : [dataPendaftar.presenter].filter(Boolean),
        duTahap1: dataPendaftar.duTahap1 || '',
        tglDU1: dataPendaftar.tglDU1 || '',
        duTahap2: dataPendaftar.duTahap2 || '',
        tglDU2: dataPendaftar.tglDU2 || '',
        caraDaftar: dataPendaftar.caraDaftar || ''
      });
    }

    getDocs(collection(db, 'presenter')).then(snapshot => {
      setPresenterList(snapshot.docs.map(doc => doc.data()));
    });

    getDocs(collection(db, 'gelombang')).then(snapshot => {
      setGelombangList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [dataPendaftar, userData, isEditData, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'duTahap1' || name === 'duTahap2') {
      // Format currency untuk field biaya DU
      const raw = value.replace(/\D/g, '');
      const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      setForm(prev => ({ ...prev, [name]: formatted }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi presenter harus dipilih
    if (!form.presenter || form.presenter.length === 0) {
      alert('Silakan pilih minimal satu presenter.');
      return;
    }

    let payload;

    if (!isEditData) {
      let idGelombang = '';
      const tglDaftar = dataPendaftar?.tglDaftar;
      if (tglDaftar) {
        const found = gelombangList.find(g => g.tanggalMulai <= tglDaftar && g.tanggalAkhir >= tglDaftar);
        if (found) idGelombang = found.id;
      }

      payload = {
        ...form,
        // Simpan biaya DU sebagai number untuk konsistensi database
        duTahap1: form.duTahap1 ? parseCurrency(form.duTahap1).toString() : '',
        duTahap2: form.duTahap2 ? parseCurrency(form.duTahap2).toString() : '',
        idPendaftar: dataPendaftar?.id || '',
        inputBy: dataPendaftar?.cabangOffice || userData?.cabangOffice || '',
        cabangOffice: dataPendaftar?.cabangOffice || userData?.cabangOffice || '',
        idGelombang,
        timestamp: new Date()
      };
    } else {
      payload = {
        ...form,
        // Simpan biaya DU sebagai number untuk konsistensi database
        duTahap1: form.duTahap1 ? parseCurrency(form.duTahap1).toString() : '',
        duTahap2: form.duTahap2 ? parseCurrency(form.duTahap2).toString() : '',
        cabangOffice: userData?.cabangOffice || '',
        timestamp: new Date()
      };
    }

    if (isEditData && dataPendaftar?.id) {
      await updateDoc(doc(db, 'daftar_ulang', dataPendaftar.id), payload);
    } else {
      await addDoc(collection(db, 'daftar_ulang'), payload);
    }

    fetchDaftarUlang && fetchDaftarUlang();
    onClose && onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: '75vw' } }}
    >
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Form Daftar Ulang</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
            <TextField label="Nomor Pendaftaran" name="nomorPendaftaran" value={form.nomorPendaftaran} disabled fullWidth />
            <TextField label="Nama Pendaftar" name="namaPendaftar" value={form.namaPendaftar} disabled fullWidth />
            <TextField label="Nomor WA" name="nomorWA" value={form.nomorWA} onChange={handleChange} fullWidth />
            <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth />
            <TextField select label="Jenis Kelamin" name="jenisKelamin" value={form.jenisKelamin} onChange={handleChange} fullWidth>
              <MenuItem value="L">Laki-laki</MenuItem>
              <MenuItem value="P">Perempuan</MenuItem>
            </TextField>
            <TextField label="Asal Sekolah" name="asalSekolah" value={form.asalSekolah} onChange={handleChange} fullWidth />
            <TextField label="Jurusan" name="jurusan" value={form.jurusan} disabled fullWidth />
            <TextField
              select
              label="Ukuran Kaos"
              name="ukuranKaos"
              value={form.ukuranKaos}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="">Pilih Ukuran</MenuItem>
              <MenuItem value="S">S</MenuItem>
              <MenuItem value="M">M</MenuItem>
              <MenuItem value="L">L</MenuItem>
              <MenuItem value="XL">XL</MenuItem>
              <MenuItem value="XXL">XXL</MenuItem>
            </TextField>
            <TextField
              label="DU Tahap 1"
              name="duTahap1"
              value={form.duTahap1}
              onChange={handleChange}
              fullWidth
              helperText="Format: 100.000"
            />
            <TextField type="date" label="Tanggal DU Tahap 1" name="tglDU1" value={form.tglDU1} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField
              label="DU Tahap 2"
              name="duTahap2"
              value={form.duTahap2}
              onChange={handleChange}
              fullWidth
              helperText="Format: 100.000"
            />
            <TextField type="date" label="Tanggal DU Tahap 2" name="tglDU2" value={form.tglDU2} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField select label="Cara Daftar" name="caraDaftar" value={form.caraDaftar} onChange={handleChange} fullWidth>
              <MenuItem value="CASH">CASH</MenuItem>
              <MenuItem value="TF">TF</MenuItem>
              <MenuItem value="CICIL">CICIL</MenuItem>
            </TextField>
          </Box>

          {/* Section Pilih Presenter - Terpisah di bawah */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>Pilih Presenter</Typography>
            <ToggleButtonGroup
              value={form.presenter}
              onChange={(e, newVal) => {
                setForm(prev => ({ ...prev, presenter: newVal }));
              }}
              color="primary"
              multiple
              sx={{ flexWrap: 'wrap', gap: 1 }}
            >
              {getAvailablePresenter().length === 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ p: 1 }}>
                  Tidak ada presenter tersedia untuk kantor cabang ini
                </Typography>
              ) : (
                getAvailablePresenter().map((p, i) => (
                  <ToggleButton
                    key={i}
                    value={p.namaLengkap}
                    sx={{
                      fontSize: 12,
                      textTransform: 'none',
                      borderRadius: '8px',
                      borderColor: '#1976d2',
                      '&.Mui-selected': {
                        backgroundColor: '#1976d2',
                        color: '#fff',
                      },
                      '&:hover': {
                        backgroundColor: '#1565c0',
                        color: '#fff'
                      }
                    }}
                  >
                    {p.namaLengkap}
                  </ToggleButton>
                ))
              )}
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {dataPendaftar?.cabangOffice || userData?.cabangOffice ?
                `Menampilkan presenter untuk ${dataPendaftar?.cabangOffice || userData?.cabangOffice} (${getAvailablePresenter().length} presenter tersedia)` :
                'Menampilkan semua presenter'
              }
            </Typography>
          </Box>

          <Button type="submit" variant="contained" fullWidth sx={{ mt: 3 }}>
            Simpan
          </Button>
        </form>
      </Box>
    </Drawer>
  );
};

export default FormDaftarUlang;
