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

const DataPresenter = () => {
  const { userData, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    idcode: '',
    namaLengkap: '',
    nomorWA: '',
    alamat: '',
    email: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [presenterList, setPresenterList] = useState([]);

  useEffect(() => {
    if (!loading && (!userData || userData.role !== 'pimpinan')) {
      navigate('/login-pimpinan');
    }
  }, [loading, userData, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const snapshot = await getDocs(collection(db, 'presenter'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPresenterList(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'presenter', editingId), form);
      } else {
        await addDoc(collection(db, 'presenter'), form);
      }
      setForm({ idcode: '', namaLengkap: '', nomorWA: '', alamat: '', email: '' });
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error('Gagal simpan:', err);
    }
  };

  const handleEdit = (item) => {
    setForm({
      idcode: item.idcode || '',
      namaLengkap: item.namaLengkap,
      nomorWA: item.nomorWA,
      alamat: item.alamat,
      email: item.email || ''
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus presenter ini?')) {
      await deleteDoc(doc(db, 'presenter', id));
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
            {editingId ? 'Edit Presenter' : 'Tambah Presenter'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField label="ID" name="idcode" fullWidth margin="normal" value={form.idcode} onChange={handleChange} required />
            <TextField label="Nama Lengkap" name="namaLengkap" fullWidth margin="normal" value={form.namaLengkap} onChange={handleChange} required />
            <TextField label="Nomor WA" name="nomorWA" fullWidth margin="normal" value={form.nomorWA} onChange={handleChange} required />
            <TextField label="Alamat" name="alamat" fullWidth margin="normal" value={form.alamat} onChange={handleChange} required />
            <TextField label="Email" name="email" fullWidth margin="normal" value={form.email} onChange={handleChange} required />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Presenter'}
            </Button>
            {editingId && (
              <Button onClick={() => {
                setEditingId(null);
                setForm({ idcode: '', namaLengkap: '', nomorWA: '', alamat: '', email: '' });
              }} fullWidth sx={{ mt: 1 }}>
                Batal Edit
              </Button>
            )}
          </form>
        </Paper>

        {/* Tabel */}
        <Paper sx={{ p: 2, width: '60%', overflowX: 'auto' }}>
          <Typography variant="h6" gutterBottom>Daftar Presenter</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Nama</TableCell>
                  <TableCell>WA</TableCell>
                  <TableCell>Alamat</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {presenterList.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.idcode}</TableCell>
                    <TableCell>{item.namaLengkap}</TableCell>
                    <TableCell>{item.nomorWA}</TableCell>
                    <TableCell>{item.alamat}</TableCell>
                    <TableCell>{item.email}</TableCell>
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

export default DataPresenter;