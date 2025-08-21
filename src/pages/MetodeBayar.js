import React, { useState, useEffect, useContext } from 'react';
import {
  Box, Typography, Paper, TextField, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { db } from '../firebase';
import {
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc
} from 'firebase/firestore';
import HeaderPimpinan from '../components/HeaderPimpinan';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MetodeBayar = () => {
  const { userData, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ idcode: '', namaMetode: '', keterangan: '' });
  const [editingId, setEditingId] = useState(null);
  const [dataList, setDataList] = useState([]);

  useEffect(() => {
    if (!loading && (!userData || userData.role !== 'pimpinan')) {
      navigate('/login-pimpinan');
    }
  }, [loading, userData, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const snapshot = await getDocs(collection(db, 'metode_bayar'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setDataList(data);
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'metode_bayar', editingId), form);
      } else {
        await addDoc(collection(db, 'metode_bayar'), form);
      }
      setForm({ idcode: '', namaMetode: '', keterangan: '' });
      setEditingId(null);
      fetchData();
    } catch (err) {
      // Handle error silently
    }
  };

  const handleEdit = (item) => {
    setForm({
      idcode: item.idcode || '',
      namaMetode: item.namaMetode || '',
      keterangan: item.keterangan || ''
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin hapus metode ini?')) {
      await deleteDoc(doc(db, 'metode_bayar', id));
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
            {editingId ? 'Edit Metode Bayar' : 'Tambah Metode Bayar'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField label="ID" name="idcode" fullWidth margin="normal" value={form.idcode} onChange={handleChange} required />
            <TextField label="Nama Metode" name="namaMetode" fullWidth margin="normal" value={form.namaMetode} onChange={handleChange} required />
            <TextField label="Keterangan" name="keterangan" fullWidth margin="normal" value={form.keterangan} onChange={handleChange} />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Metode'}
            </Button>
            {editingId && (
              <Button onClick={() => {
                setEditingId(null);
                setForm({ idcode: '', namaMetode: '', keterangan: '' });
              }} fullWidth sx={{ mt: 1 }}>
                Batal Edit
              </Button>
            )}
          </form>
        </Paper>

        {/* Tabel */}
        <Paper sx={{ p: 2, width: '60%' }}>
          <Typography variant="h6" gutterBottom>Daftar Metode Bayar</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Nama Metode</TableCell>
                  <TableCell>Keterangan</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataList.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.idcode}</TableCell>
                    <TableCell>{item.namaMetode}</TableCell>
                    <TableCell>{item.keterangan}</TableCell>
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

export default MetodeBayar;
