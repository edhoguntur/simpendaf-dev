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

const formatNominal = (value) => {
  return value.replace(/\D/g, '') // hapus non-digit
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // tambah titik per 3 digit
};

const TambahSumberInformasi = () => {
  const { userData, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    sumber: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [sumberList, setSumberList] = useState([]);

  useEffect(() => {
    if (!loading && (!userData || userData.role !== 'pimpinan')) {
      navigate('/login-pimpinan');
    }
  }, [loading, userData, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const snapshot = await getDocs(collection(db, 'sumber_informasi'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSumberList(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'sumber_informasi', editingId), form);
      } else {
        await addDoc(collection(db, 'sumber_informasi'), form);
      }
      setForm({ sumber: '' });
      setEditingId(null);
      fetchData();
    } catch (err) {
      // Handle error silently
    }
  };

  const handleEdit = (item) => {
    setForm({ sumber: item.sumber});
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin hapus data ini?')) {
      await deleteDoc(doc(db, 'sumber_informasi', id));
      fetchData();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'nominal') {
      setForm(prev => ({ ...prev, [name]: formatNominal(value) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
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
            {editingId ? 'Edit Sumber Informasi' : 'Tambah Sumber Informasi'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Sumber Informasi" name="sumber" fullWidth margin="normal"
              value={form.sumber} onChange={handleChange} required
            />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Sumber Informasi'}
            </Button>
            {editingId && (
              <Button onClick={() => {
                setEditingId(null);
                setForm({ sumber: '' });
              }} fullWidth sx={{ mt: 1 }}>
                Batal Edit
              </Button>
            )}
          </form>
        </Paper>

        {/* Tabel Sumber Informasi */}
        <Paper sx={{ p: 2, width: '60%', overflowX: 'auto' }}>
          <Typography variant="h6" gutterBottom>Daftar Sumber Informasi</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Sumber Informasi</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sumberList.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.sumber}</TableCell>
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

export default TambahSumberInformasi;
