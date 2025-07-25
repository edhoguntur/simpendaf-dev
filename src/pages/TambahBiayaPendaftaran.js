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

const formatBiaya = (value) => {
  return value.replace(/\D/g, '') // hapus non-digit
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // tambah titik per 3 digit
};

const TambahBiayaPendaftaran = () => {
  const { userData, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    jenisBiayaPendaftaran: '',
    jumlahBiayaPendaftaran: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [jenisBiayaPendaftaranList, setJenisBiayaPendaftaranList] = useState([]);

  useEffect(() => {
    if (!loading && (!userData || userData.role !== 'pimpinan')) {
      navigate('/login-pimpinan');
    }
  }, [loading, userData, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const snapshot = await getDocs(collection(db, 'biaya_pendaftaran'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setJenisBiayaPendaftaranList(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'jumlahBiayaPendaftaran') {
      setForm(prev => ({ ...prev, [name]: formatBiaya(value) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'biaya_pendaftaran', editingId), form);
      } else {
        await addDoc(collection(db, 'biaya_pendaftaran'), form);
      }
      setForm({ jenisBiayaPendaftaran: '', jumlahBiayaPendaftaran: '' });
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error('Gagal simpan:', err);
    }
  };

  const handleEdit = (item) => {
    setForm({ jenisBiayaPendaftaran: item.jenisBiayaPendaftaran, jumlahBiayaPendaftaran: item.jumlahBiayaPendaftaran });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin hapus data ini?')) {
      await deleteDoc(doc(db, 'biaya_pendaftaran', id));
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
            {editingId ? 'Edit Biaya Pendaftaran' : 'Tambah Biaya Pendaftaran'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Jenis Biaya Pendaftaran" name="jenisBiayaPendaftaran" fullWidth margin="normal"
              value={form.jenisBiayaPendaftaran} onChange={handleChange} required
            />
            <TextField
              label="Jumlah Biaya Pendaftaran (cth: 200.000)" name="jumlahBiayaPendaftaran" fullWidth margin="normal"
              value={form.jumlahBiayaPendaftaran} onChange={handleChange} required
            />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Biaya Pendaftaran'}
            </Button>
            {editingId && (
              <Button onClick={() => {
                setEditingId(null);
                setForm({ jenisBiayaPendaftaran: '', jumlahBiayaPendaftaran: '' });
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
                  <TableCell>Jenis Biaya Pendaftaran</TableCell>
                  <TableCell>Jumlah Biaya Pendaftaran</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jenisBiayaPendaftaranList.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.jenisBiayaPendaftaran}</TableCell>
                    <TableCell>{item.jumlahBiayaPendaftaran}</TableCell>
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

export default TambahBiayaPendaftaran;
