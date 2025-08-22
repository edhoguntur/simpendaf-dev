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

const DaftarJurusan = () => {
  const { userData, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    kode: '',
    nama: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [jurusanList, setJurusanList] = useState([]);

  useEffect(() => {
    if (!loading && (!userData || userData.role !== 'pimpinan')) {
      navigate('/login-pimpinan');
    }
  }, [loading, userData, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const snapshot = await getDocs(collection(db, 'daftar_jurusan'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setJurusanList(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'daftar_jurusan', editingId), form);
      } else {
        await addDoc(collection(db, 'daftar_jurusan'), form);
      }
      setForm({ kode: '', nama: '' });
      setEditingId(null);
      fetchData();
    } catch (err) {
      // Handle error silently
    }
  };

  const handleEdit = (item) => {
    setForm({ kode: item.kode, nama: item.nama });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin hapus data ini?')) {
      await deleteDoc(doc(db, 'daftar_jurusan', id));
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
            {editingId ? 'Edit Jurusan' : 'Tambah Jurusan'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Kode Jurusan" name="kode" fullWidth margin="normal"
              value={form.kode} onChange={handleChange} required
            />
            <TextField
              label="Nama Jurusan" name="nama" fullWidth margin="normal"
              value={form.nama} onChange={handleChange} required
            />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              {editingId ? 'Update' : 'Tambah'}
            </Button>
          </form>
        </Paper>

        {/* Table */}
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" gutterBottom>Daftar Jurusan</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Kode</TableCell>
                  <TableCell>Nama Jurusan</TableCell>
                  <TableCell>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jurusanList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.kode}</TableCell>
                    <TableCell>{item.nama}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(item)} color="primary">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(item.id)} color="error">
                        <Delete />
                      </IconButton>
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

export default DaftarJurusan;
