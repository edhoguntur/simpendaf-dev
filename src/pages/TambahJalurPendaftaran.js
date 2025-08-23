import React, { useContext, useEffect, useState } from 'react';
import {
  Box, Typography, TextField, Button, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, MenuItem
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { db } from '../firebase';
import {
  addDoc, collection, getDocs, deleteDoc, updateDoc, doc
} from 'firebase/firestore';
import HeaderPimpinan from '../components/HeaderPimpinan';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TambahJalurPendaftaran = () => {
  const { userData, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    jalurPendaftaran: '',
    kantorCabang: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [jalurList, setJalurList] = useState([]);
  const [kantorList, setKantorList] = useState([]);

  useEffect(() => {
    if (!loading && (!userData || userData.role !== 'pimpinan')) {
      navigate('/login-pimpinan');
    }
  }, [loading, userData, navigate]);

  useEffect(() => {
    fetchJalur();
    fetchKantor();
  }, []);

  const fetchJalur = async () => {
    const snapshot = await getDocs(collection(db, 'jalur_pendaftaran'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setJalurList(data);
  };

  const fetchKantor = async () => {
    const snapshot = await getDocs(collection(db, 'kantor'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setKantorList(data);
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'jalur_pendaftaran', editingId), form);
      } else {
        await addDoc(collection(db, 'jalur_pendaftaran'), form);
      }
      setForm({ jalurPendaftaran: '', kantorCabang: '' });
      setEditingId(null);
      fetchJalur();
    } catch (err) {
      // Handle error silently
    }
  };

  const handleEdit = (item) => {
    setForm({
      jalurPendaftaran: item.jalurPendaftaran || '',
      kantorCabang: item.kantorCabang || ''
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus jalur ini?')) {
      await deleteDoc(doc(db, 'jalur_pendaftaran', id));
      fetchJalur();
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <Box>
      <HeaderPimpinan />
      <Box sx={{ display: 'flex', gap: 2, p: 4 }}>
        {/* Form Input */}
        <Paper sx={{ p: 3, width: '40%' }}>
          <Typography variant="h6" gutterBottom>
            {editingId ? 'Edit Jalur Pendaftaran' : 'Tambah Jalur Pendaftaran'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              select
              label="Kantor Cabang"
              name="kantorCabang"
              value={form.kantorCabang}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            >
              <MenuItem value="">Pilih Kantor Cabang</MenuItem>
              {kantorList.map((kantor) => (
                <MenuItem key={kantor.id} value={kantor.namaKantor}>
                  {kantor.namaKantor}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Jalur Pendaftaran"
              name="jalurPendaftaran"
              value={form.jalurPendaftaran}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />

            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Jalur'}
            </Button>
            {editingId && (
              <Button onClick={() => {
                setEditingId(null);
                setForm({ jalurPendaftaran: '', kantorCabang: '' });
              }} fullWidth sx={{ mt: 1 }}>
                Batal Edit
              </Button>
            )}
          </form>
        </Paper>

        {/* Tabel Jalur */}
        <Paper sx={{ p: 2, width: '60%', overflowX: 'auto' }}>
          <Typography variant="h6" gutterBottom>Daftar Jalur Pendaftaran</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Kantor Cabang</TableCell>
                  <TableCell>Jalur Pendaftaran</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jalurList.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.kantorCabang}</TableCell>
                    <TableCell>{item.jalurPendaftaran}</TableCell>
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

export default TambahJalurPendaftaran;
