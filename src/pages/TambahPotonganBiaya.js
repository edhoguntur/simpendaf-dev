import React, { useContext, useEffect, useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button,
  TableContainer, Table, TableHead, TableBody,
  TableRow, TableCell, IconButton
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
    jenisPotongan: '',
    jumlahPotongan: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [jenisPotonganList, setJenisPotonganList] = useState([]);

  useEffect(() => {
    if (!loading && (!userData || userData.role !== 'pimpinan')) {
      navigate('/login-pimpinan');
    }
  }, [loading, userData, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const snapshot = await getDocs(collection(db, 'potongan_biaya'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setJenisPotonganList(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'jumlahPotongan') {
      setForm(prev => ({ ...prev, [name]: formatPotongan(value) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'potongan_biaya', editingId), form);
      } else {
        await addDoc(collection(db, 'potongan_biaya'), form);
      }
      setForm({ jenisPotongan: '', jumlahPotongan: '' });
      setEditingId(null);
      fetchData();
    } catch (err) {
      // Handle error silently
    }
  };

  const handleEdit = (item) => {
    setForm({ jenisPotongan: item.jenisPotongan, jumlahPotongan: item.jumlahPotongan });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin hapus data ini?')) {
      await deleteDoc(doc(db, 'potongan_biaya', id));
      fetchData();
    }
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
            <TextField
              label="Jenis Potongan" name="jenisPotongan" fullWidth margin="normal"
              value={form.jenisPotongan} onChange={handleChange} required
            />
            <TextField
              label="Jumlah Potongan (cth: 200.000)" name="jumlahPotongan" fullWidth margin="normal"
              value={form.jumlahPotongan} onChange={handleChange} required
            />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Potongan Biaya'}
            </Button>
            {editingId && (
              <Button onClick={() => {
                setEditingId(null);
                setForm({ jenisPotongan: '', jumlahPotongan: '' });
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
                  <TableCell>Jenis Potongan</TableCell>
                  <TableCell>Jumlah Potongan</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jenisPotonganList.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.jenisPotongan}</TableCell>
                    <TableCell>{item.jumlahPotongan}</TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleEdit(item)}><Edit fontSize="small" /></IconButton>
                      <IconButton onClick={() => handleDelete(item.id)}><Delete fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default TambahPotonganBiaya;
