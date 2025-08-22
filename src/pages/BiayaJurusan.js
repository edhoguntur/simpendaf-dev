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

const BiayaJurusan = () => {
  const { userData, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    cabangOffice: '',
    jurusanId: '',
    biaya: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [biayaJurusanList, setBiayaJurusanList] = useState([]);
  const [kantorList, setKantorList] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);

  useEffect(() => {
    if (!loading && (!userData || userData.role !== 'pimpinan')) {
      navigate('/login-pimpinan');
    }
  }, [loading, userData, navigate]);

  useEffect(() => {
    fetchData();
    fetchKantor();
    fetchJurusan();
  }, []);

  const fetchData = async () => {
    const snapshot = await getDocs(collection(db, 'biaya_jurusan'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBiayaJurusanList(data);
  };

  const fetchKantor = async () => {
    const snapshot = await getDocs(collection(db, 'kantor'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setKantorList(data);
  };

  const fetchJurusan = async () => {
    const snapshot = await getDocs(collection(db, 'daftar_jurusan'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setJurusanList(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'biaya') {
      setForm(prev => ({ ...prev, [name]: formatBiaya(value) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'biaya_jurusan', editingId), form);
      } else {
        await addDoc(collection(db, 'biaya_jurusan'), form);
      }
      setForm({ cabangOffice: '', jurusanId: '', biaya: '' });
      setEditingId(null);
      fetchData();
    } catch (err) {
      // Handle error silently
    }
  };

  const handleEdit = (item) => {
    setForm({
      cabangOffice: item.cabangOffice,
      jurusanId: item.jurusanId,
      biaya: item.biaya
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin hapus data ini?')) {
      await deleteDoc(doc(db, 'biaya_jurusan', id));
      fetchData();
    }
  };

  const getJurusanName = (jurusanId) => {
    const jurusan = jurusanList.find(j => j.id === jurusanId);
    return jurusan ? `${jurusan.kode} - ${jurusan.nama}` : 'Tidak ditemukan';
  };

  const getKantorName = (kantorId) => {
    const kantor = kantorList.find(k => k.id === kantorId);
    return kantor ? kantor.namaKantor : 'Tidak ditemukan';
  };

  if (loading) return <p>Loading...</p>;

  return (
    <Box>
      <HeaderPimpinan />
      <Box sx={{ display: 'flex', gap: 2, p: 4 }}>
        {/* Form */}
        <Paper sx={{ p: 3, width: '40%' }}>
          <Typography variant="h6" gutterBottom>
            {editingId ? 'Edit Biaya Jurusan' : 'Tambah Biaya Jurusan'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Cabang Office</InputLabel>
              <Select
                name="cabangOffice"
                value={form.cabangOffice}
                onChange={handleChange}
              >
                {kantorList.map((kantor) => (
                  <MenuItem key={kantor.id} value={kantor.id}>
                    {kantor.namaKantor}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" required>
              <InputLabel>Jurusan</InputLabel>
              <Select
                name="jurusanId"
                value={form.jurusanId}
                onChange={handleChange}
              >
                {jurusanList.map((jurusan) => (
                  <MenuItem key={jurusan.id} value={jurusan.id}>
                    {jurusan.kode} - {jurusan.nama}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Biaya" name="biaya" fullWidth margin="normal"
              value={form.biaya} onChange={handleChange} required
              placeholder="Contoh: 1.500.000"
            />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              {editingId ? 'Update' : 'Tambah'}
            </Button>
          </form>
        </Paper>

        {/* Table */}
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" gutterBottom>Daftar Biaya Jurusan per Cabang</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Cabang Office</TableCell>
                  <TableCell>Jurusan</TableCell>
                  <TableCell>Biaya</TableCell>
                  <TableCell>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {biayaJurusanList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{getKantorName(item.cabangOffice)}</TableCell>
                    <TableCell>{getJurusanName(item.jurusanId)}</TableCell>
                    <TableCell>Rp {item.biaya}</TableCell>
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

export default BiayaJurusan;
