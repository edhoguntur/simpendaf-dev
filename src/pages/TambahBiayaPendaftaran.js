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

const formatBiaya = (value) => {
  return value.replace(/\D/g, '') // hapus non-digit
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // tambah titik per 3 digit
};

const TambahBiayaPendaftaran = () => {
  const { userData, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    cabangOffice: '',
    jalurPendaftaran: '',
    jumlahBiayaPendaftaran: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [jenisBiayaPendaftaranList, setJenisBiayaPendaftaranList] = useState([]);
  const [kantorList, setKantorList] = useState([]);
  const [jalurList, setJalurList] = useState([]);

  useEffect(() => {
    if (!loading && (!userData || userData.role !== 'pimpinan')) {
      navigate('/login-pimpinan');
    }
  }, [loading, userData, navigate]);

  useEffect(() => {
    fetchData();
    fetchKantor();
    fetchJalur();
  }, []);

  const fetchData = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'biaya_pendaftaran'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJenisBiayaPendaftaranList(data);
    } catch (error) {
      // Handle error silently
    }
  };

  const fetchKantor = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'kantor'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setKantorList(data);
    } catch (error) {
      // Handle error silently
    }
  };

  const fetchJalur = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'jalur_pendaftaran'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJalurList(data);
    } catch (error) {
      // Handle error silently
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'jumlahBiayaPendaftaran') {
      setForm(prev => ({ ...prev, [name]: formatBiaya(value) }));
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

    try {
      // Otomatis set jenisBiayaPendaftaran dari jalur pendaftaran yang dipilih
      const dataToSave = {
        ...form,
        jenisBiayaPendaftaran: form.jalurPendaftaran
      };

      if (editingId) {
        await updateDoc(doc(db, 'biaya_pendaftaran', editingId), dataToSave);
      } else {
        await addDoc(collection(db, 'biaya_pendaftaran'), dataToSave);
      }
      setForm({ cabangOffice: '', jalurPendaftaran: '', jumlahBiayaPendaftaran: '' });
      setEditingId(null);
      fetchData();
    } catch (err) {
      // Handle error silently
    }
  };  const handleEdit = (item) => {
    setForm({
      cabangOffice: item.cabangOffice || '',
      jalurPendaftaran: item.jalurPendaftaran || '',
      jumlahBiayaPendaftaran: item.jumlahBiayaPendaftaran
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin hapus data ini?')) {
      await deleteDoc(doc(db, 'biaya_pendaftaran', id));
      fetchData();
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
            {editingId ? 'Edit Biaya Pendaftaran' : 'Tambah Biaya Pendaftaran'}
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
              label="Jumlah Biaya Pendaftaran"
              name="jumlahBiayaPendaftaran"
              fullWidth
              margin="normal"
              value={form.jumlahBiayaPendaftaran}
              onChange={handleChange}
              required
              placeholder="Contoh: 200.000"
              InputLabelProps={{ shrink: true }}
            />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Biaya Pendaftaran'}
            </Button>
            {editingId && (
              <Button onClick={() => {
                setEditingId(null);
                setForm({ cabangOffice: '', jalurPendaftaran: '', jumlahBiayaPendaftaran: '' });
              }} fullWidth sx={{ mt: 1 }}>
                Batal Edit
              </Button>
            )}
          </form>
        </Paper>

        {/* Tabel Nama */}
        <Paper sx={{ p: 2, width: '60%', overflowX: 'auto' }}>
          <Typography variant="h6" gutterBottom>Daftar Biaya Pendaftaran</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Kantor Cabang</TableCell>
                  <TableCell>Jalur Pendaftaran</TableCell>
                  <TableCell>Jumlah Biaya Pendaftaran</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jenisBiayaPendaftaranList.map((item, index) => {
                  // cabangOffice sekarang menyimpan nama kantor langsung
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.cabangOffice || 'Belum dipilih'}</TableCell>
                      <TableCell>{item.jalurPendaftaran || 'Belum dipilih'}</TableCell>
                      <TableCell>Rp {item.jumlahBiayaPendaftaran}</TableCell>
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

export default TambahBiayaPendaftaran;
