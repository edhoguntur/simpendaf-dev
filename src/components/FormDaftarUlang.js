import React, { useEffect, useState, useContext } from 'react';
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
      const allPresenters = snapshot.docs.map(doc => doc.data());
      let filteredPresenters = allPresenters;

      // Filter presenter berdasarkan role user
      if (userData?.role === 'presenter' && userData?.cabangOffice) {
        // Presenter hanya bisa melihat presenter dari cabangOffice yang sama
        filteredPresenters = allPresenters.filter(p => p.alamat === userData.cabangOffice);
      }
      // Pimpinan bisa melihat semua presenter (tidak perlu filter)

      setPresenterList(filteredPresenters);
    });

    getDocs(collection(db, 'gelombang')).then(snapshot => {
      setGelombangList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [dataPendaftar, userData, isEditData, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'duTahap1' || name === 'duTahap2') {
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
        idPendaftar: dataPendaftar?.id || '',
        inputBy: dataPendaftar?.cabangOffice || userData?.cabangOffice || '',
        cabangOffice: dataPendaftar?.cabangOffice || userData?.cabangOffice || '',
        idGelombang,
        timestamp: new Date()
      };
    } else {
      payload = {
        ...form,
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
            <Box>
              <Typography variant="body2" gutterBottom>Presenter</Typography>
              <ToggleButtonGroup
                value={form.presenter}
                onChange={(e, newVal) => {
                  // Jika role presenter, bisa memilih presenter dengan cabangOffice yang sama
                  if (userData?.role === 'presenter') {
                    // Filter hanya presenter yang memiliki cabangOffice yang sama
                    const validPresenters = newVal.filter(presenterName => {
                      const presenter = presenterList.find(p => p.namaLengkap === presenterName);
                      return presenter && presenter.alamat === userData.cabangOffice;
                    });
                    setForm(prev => ({ ...prev, presenter: validPresenters }));
                  } else {
                    // Pimpinan bisa memilih siapa saja
                    setForm(prev => ({ ...prev, presenter: newVal }));
                  }
                }}
                color="primary"
                multiple
                sx={{ flexWrap: 'wrap', gap: 1 }}
              >
                {presenterList.map((p, i) => (
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
                    {userData?.role === 'presenter' && p.namaLengkap === userData.namaLengkap &&
                      <Typography variant="caption" sx={{ ml: 1, opacity: 0.7 }}>(Anda)</Typography>
                    }
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              {userData?.role === 'presenter' && userData?.cabangOffice && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Menampilkan presenter dari cabang: {userData.cabangOffice} ({presenterList.length} presenter tersedia)
                </Typography>
              )}
              {userData?.role === 'pimpinan' && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Menampilkan semua presenter ({presenterList.length} presenter tersedia)
                </Typography>
              )}
            </Box>
            <TextField label="DU Tahap 1" name="duTahap1" value={form.duTahap1} onChange={handleChange} fullWidth />
            <TextField type="date" label="Tanggal DU Tahap 1" name="tglDU1" value={form.tglDU1} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="DU Tahap 2" name="duTahap2" value={form.duTahap2} onChange={handleChange} fullWidth />
            <TextField type="date" label="Tanggal DU Tahap 2" name="tglDU2" value={form.tglDU2} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField select label="Cara Daftar" name="caraDaftar" value={form.caraDaftar} onChange={handleChange} fullWidth>
              <MenuItem value="CASH">CASH</MenuItem>
              <MenuItem value="TF">TF</MenuItem>
              <MenuItem value="CICIL">CICIL</MenuItem>
            </TextField>
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
