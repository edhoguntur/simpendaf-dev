import React, { useContext, useEffect, useState } from 'react';
import {
  Box, Typography, TextField, Button, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { db } from '../firebase';
import {
  addDoc, collection, getDocs, deleteDoc, updateDoc, doc
} from 'firebase/firestore';
import HeaderPimpinan from '../components/HeaderPimpinan';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TambahKantor = () => {
  const { userData, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    namaKantor: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [kantorList, setKantorList] = useState([]);

  useEffect(() => {
    if (!loading && (!userData || userData.role !== 'pimpinan')) {
      navigate('/login-pimpinan');
    }
  }, [loading, userData, navigate]);

  useEffect(() => {
    fetchKantor();
  }, []);

  const fetchKantor = async () => {
    const snapshot = await getDocs(collection(db, 'kantor'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('kantorList:', data); // debug
    setKantorList(data);
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'kantor', editingId), form);
      } else {
        await addDoc(collection(db, 'kantor'), form);
      }
      setForm({ namaKantor: '' });
      setEditingId(null);
      fetchKantor();
    } catch (err) {
      console.error('Gagal simpan:', err);
    }
  };

  const handleEdit = (item) => {
    setForm({
      namaKantor: item.namaKantor || ''
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus kantor ini?')) {
      await deleteDoc(doc(db, 'kantor', id));
      fetchKantor();
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
            {editingId ? 'Edit Kantor' : 'Tambah Kantor'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Nama Kantor"
              name="namaKantor"
              value={form.namaKantor}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />

            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Kantor'}
            </Button>
            {editingId && (
              <Button onClick={() => {
                setEditingId(null);
                setForm({ namaKantor: '' });
              }} fullWidth sx={{ mt: 1 }}>
                Batal Edit
              </Button>
            )}
          </form>
        </Paper>

        {/* Tabel Kantor */}
        <Paper sx={{ p: 2, width: '60%', overflowX: 'auto' }}>
          <Typography variant="h6" gutterBottom>Daftar Kantor</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Nama Kantor</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {kantorList.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.namaKantor}</TableCell>
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

export default TambahKantor;
