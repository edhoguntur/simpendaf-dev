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

const TambahGelombang = () => {
  const { userData, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    namaGelombang: '',
    tanggalMulai: '',
    tanggalAkhir: '',
    tanggalDaftarUlangMulai: '',
    tanggalDaftarUlangAkhir: '',
    keteranganDU: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [gelombangList, setGelombangList] = useState([]);

  useEffect(() => {
    if (!loading && (!userData || userData.role !== 'pimpinan')) {
      navigate('/login-pimpinan');
    }
  }, [loading, userData, navigate]);

  useEffect(() => {
    fetchGelombang();
  }, []);

  const fetchGelombang = async () => {
    const snapshot = await getDocs(collection(db, 'gelombang'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setGelombangList(data);
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'gelombang', editingId), form);
      } else {
        await addDoc(collection(db, 'gelombang'), form);
      }
      setForm({
        namaGelombang: '',
        tanggalMulai: '',
        tanggalAkhir: '',
        tanggalDaftarUlangMulai: '',
        tanggalDaftarUlangAkhir: '',
        keteranganDU: ''
      });
      setEditingId(null);
      fetchGelombang();
    } catch (err) {
      // Handle error silently
    }
  };

  const handleEdit = (item) => {
    setForm({
      namaGelombang: item.namaGelombang || '',
      tanggalMulai: item.tanggalMulai || '',
      tanggalAkhir: item.tanggalAkhir || '',
      tanggalDaftarUlangMulai: item.tanggalDaftarUlangMulai || '',
      tanggalDaftarUlangAkhir: item.tanggalDaftarUlangAkhir || '',
      keteranganDU: item.keteranganDU || ''
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus gelombang ini?')) {
      await deleteDoc(doc(db, 'gelombang', id));
      fetchGelombang();
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
            {editingId ? 'Edit Gelombang' : 'Tambah Gelombang'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField label="Nama Gelombang" name="namaGelombang" value={form.namaGelombang} onChange={handleChange} fullWidth margin="normal" required />
            <TextField type="date" label="Tanggal Mulai" name="tanggalMulai" value={form.tanggalMulai} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />
            <TextField type="date" label="Tanggal Akhir" name="tanggalAkhir" value={form.tanggalAkhir} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />

            <Typography variant="subtitle1" sx={{ mt: 2 }}>Periode Daftar Ulang</Typography>
            <TextField type="date" label="Tgl DU Mulai" name="tanggalDaftarUlangMulai" value={form.tanggalDaftarUlangMulai} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} />
            <TextField type="date" label="Tgl DU Akhir" name="tanggalDaftarUlangAkhir" value={form.tanggalDaftarUlangAkhir} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} />
            <TextField label="Keterangan DU" name="keteranganDU" value={form.keteranganDU} onChange={handleChange} fullWidth margin="normal" />

            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Gelombang'}
            </Button>
            {editingId && (
              <Button onClick={() => {
                setEditingId(null);
                setForm({
                  namaGelombang: '',
                  tanggalMulai: '',
                  tanggalAkhir: '',
                  tanggalDaftarUlangMulai: '',
                  tanggalDaftarUlangAkhir: '',
                  keteranganDU: ''
                });
              }} fullWidth sx={{ mt: 1 }}>
                Batal Edit
              </Button>
            )}
          </form>
        </Paper>

        {/* Tabel Gelombang */}
        <Paper sx={{ p: 2, width: '60%', overflowX: 'auto' }}>
          <Typography variant="h6" gutterBottom>Daftar Gelombang</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Nama Gelombang</TableCell>
                  <TableCell>Periode</TableCell>
                  <TableCell>Periode DU</TableCell>
                  <TableCell>Keterangan DU</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gelombangList.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.namaGelombang}</TableCell>
                    <TableCell>{item.tanggalMulai} s/d {item.tanggalAkhir}</TableCell>
                    <TableCell>{item.tanggalDaftarUlangMulai} s/d {item.tanggalDaftarUlangAkhir}</TableCell>
                    <TableCell>{item.keteranganDU}</TableCell>
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

export default TambahGelombang;
