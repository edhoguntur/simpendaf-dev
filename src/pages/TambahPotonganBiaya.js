import React, { useContext, useEffect, useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button,
  TableContainer, Table, TableHead, TableBody,
  TableRow, TableCell, IconButton, FormControl,
  InputLabel, Select, MenuItem
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { db } from '../firebase';
import {
  collection, addDoc, getDocs, deleteDoc, updateDoc, doc
} from 'firebase/firestore';
import HeaderPimpinan from '../components/HeaderPimpinan';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const formatPotongan = (value) => {
  return value.replace(/\D/g, '') // hapus non-digit
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // tambah titik per 3 digit
};

const TambahPotonganBiaya = () => {
  const { userData, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    cabangOffice: '',
    jalurPendaftaran: '',
    jenisPotongan: '',
    jumlahPotongan: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [jenisPotonganList, setJenisPotonganList] = useState([]);
  const [kantorList, setKantorList] = useState([]);
  const [jalurList, setJalurList] = useState([]);

  useEffect(() => {
    if (!loading && (!userData || userData.role !== 'pimpinan')) {
      navigate('/login-pimpinan');
    }
  }, [loading, userData, navigate]);

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      if (isMounted) {
        await Promise.all([
          fetchData(),
          fetchKantor(),
          fetchJalur()
        ]);
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchData = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'potongan_biaya'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJenisPotonganList(data);
    } catch (error) {
      console.error('Error fetching potongan biaya:', error);
    }
  };

  const fetchKantor = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'kantor'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setKantorList(data);
    } catch (error) {
      console.error('Error fetching kantor:', error);
    }
  };

  const fetchJalur = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'jalur_pendaftaran'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJalurList(data);
    } catch (error) {
      console.error('Error fetching jalur pendaftaran:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'jumlahPotongan') {
      setForm(prev => ({ ...prev, [name]: formatPotongan(value) }));
    } else if (name === 'cabangOffice') {
      // Reset jalur pendaftaran ketika kantor cabang berubah
      setForm(prev => ({
        ...prev,
        [name]: value,
        jalurPendaftaran: ''
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi form
    if (!form.cabangOffice || !form.jalurPendaftaran || !form.jenisPotongan || !form.jumlahPotongan) {
      alert('Semua field harus diisi');
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'potongan_biaya', editingId), form);
      } else {
        await addDoc(collection(db, 'potongan_biaya'), form);
      }
      setForm({ cabangOffice: '', jalurPendaftaran: '', jenisPotongan: '', jumlahPotongan: '' });
      setEditingId(null);
      await fetchData();
    } catch (err) {
      console.error('Error saving data:', err);
      alert('Terjadi kesalahan saat menyimpan data');
    }
  };

  const handleEdit = (item) => {
    setForm({
      cabangOffice: item.cabangOffice || '',
      jalurPendaftaran: item.jalurPendaftaran || '',
      jenisPotongan: item.jenisPotongan || '',
      jumlahPotongan: item.jumlahPotongan || ''
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin hapus data ini?')) {
      try {
        await deleteDoc(doc(db, 'potongan_biaya', id));
        await fetchData();
      } catch (error) {
        console.error('Error deleting data:', error);
        alert('Terjadi kesalahan saat menghapus data');
      }
    }
  };

  // Fungsi untuk mendapatkan jalur pendaftaran berdasarkan kantor cabang yang dipilih
  const getAvailableJalur = () => {
    if (!form.cabangOffice || !jalurList.length) return [];
    return jalurList.filter(jalur => jalur.kantorCabang === form.cabangOffice);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <Box>
      <HeaderPimpinan />
      <Box sx={{ display: 'flex', gap: 2, p: 4 }}>
        {/* Form */}
        <Paper sx={{ p: 3, width: '40%' }}>
          <Typography variant="h6" gutterBottom>
            {editingId ? 'Edit Potongan Biaya' : 'Tambah Potongan Biaya'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Kantor Cabang</InputLabel>
              <Select
                name="cabangOffice"
                value={form.cabangOffice}
                onChange={handleChange}
                label="Kantor Cabang"
              >
                {kantorList.length === 0 ? (
                  <MenuItem disabled>Tidak ada kantor tersedia</MenuItem>
                ) : (
                  kantorList.map((kantor) => (
                    <MenuItem key={kantor.id} value={kantor.namaKantor}>
                      {kantor.namaKantor}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" required>
              <InputLabel>Jalur Pendaftaran</InputLabel>
              <Select
                name="jalurPendaftaran"
                value={form.jalurPendaftaran}
                onChange={handleChange}
                label="Jalur Pendaftaran"
                disabled={!form.cabangOffice}
              >
                {!form.cabangOffice ? (
                  <MenuItem disabled>Pilih kantor cabang terlebih dahulu</MenuItem>
                ) : getAvailableJalur().length === 0 ? (
                  <MenuItem disabled>Tidak ada jalur tersedia untuk kantor ini</MenuItem>
                ) : (
                  getAvailableJalur().map((jalur) => (
                    <MenuItem key={jalur.id} value={jalur.jalurPendaftaran}>
                      {jalur.jalurPendaftaran}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            <TextField
              label="Jenis Potongan"
              name="jenisPotongan"
              fullWidth
              margin="normal"
              value={form.jenisPotongan}
              onChange={handleChange}
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Jumlah Potongan"
              name="jumlahPotongan"
              fullWidth
              margin="normal"
              value={form.jumlahPotongan}
              onChange={handleChange}
              required
              placeholder="Contoh: 200.000"
              InputLabelProps={{ shrink: true }}
            />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Potongan Biaya'}
            </Button>
            {editingId && (
              <Button onClick={() => {
                setEditingId(null);
                setForm({ cabangOffice: '', jalurPendaftaran: '', jenisPotongan: '', jumlahPotongan: '' });
              }} fullWidth sx={{ mt: 1 }}>
                Batal Edit
              </Button>
            )}
          </form>
        </Paper>

        {/* Tabel Nama */}
        <Paper sx={{ p: 2, width: '60%', overflowX: 'auto' }}>
          <Typography variant="h6" gutterBottom>Daftar Potongan Biaya</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Kantor Cabang</TableCell>
                  <TableCell>Jalur Pendaftaran</TableCell>
                  <TableCell>Jenis Potongan</TableCell>
                  <TableCell>Jumlah Potongan</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jenisPotonganList.map((item, index) => {
                  // cabangOffice sekarang menyimpan nama kantor langsung
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.cabangOffice || 'Belum dipilih'}</TableCell>
                      <TableCell>{item.jalurPendaftaran || 'Belum dipilih'}</TableCell>
                      <TableCell>{item.jenisPotongan || 'Tidak ada'}</TableCell>
                      <TableCell>Rp {item.jumlahPotongan || '0'}</TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => handleEdit(item)}><Edit fontSize="small" /></IconButton>
                        <IconButton onClick={() => handleDelete(item.id)}><Delete fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default TambahPotonganBiaya;
