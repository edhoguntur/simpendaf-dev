// src/components/FormTambahUser.js
import React, { useState } from 'react';
import {
  Button, TextField, Typography, MenuItem, Paper
} from '@mui/material';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const FormTambahUser = () => {
  const [form, setForm] = useState({
    email: '',
    namaLengkap: '',
    role: 'pegawai',
    cabangOffice: ''
  });
  const [sukses, setSukses] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSukses('');
    try {
      await addDoc(collection(db, 'users'), {
        email: form.email,
        namaLengkap: form.namaLengkap,
        role: form.role,
        cabangOffice: form.cabangOffice,
        uid: '' // nanti diisi manual saat pegawai login dengan Google
      });
      setSukses('User berhasil ditambahkan.');
      setForm({ email: '', namaLengkap: '', role: 'pegawai', cabangOffice: '' });
    } catch (err) {
      setError('Gagal menambahkan user.');
      console.error(err);
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 3, maxWidth: 500 }}>
      <Typography variant="h6" gutterBottom>Tambah User Pegawai</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth margin="normal" label="Email"
          name="email" value={form.email} onChange={handleChange} required
        />
        <TextField
          fullWidth margin="normal" label="Nama Lengkap"
          name="namaLengkap" value={form.namaLengkap} onChange={handleChange} required
        />
        <TextField
          fullWidth margin="normal" label="Cabang Office"
          name="cabangOffice" value={form.cabangOffice} onChange={handleChange} required
        />
        <TextField
          select fullWidth margin="normal" label="Role"
          name="role" value={form.role} onChange={handleChange}
        >
          <MenuItem value="pegawai">Pegawai</MenuItem>
          <MenuItem value="pimpinan">Pimpinan</MenuItem>
        </TextField>
        <Button variant="contained" type="submit" fullWidth sx={{ mt: 2 }}>Simpan</Button>
        {sukses && <Typography color="success.main" mt={2}>{sukses}</Typography>}
        {error && <Typography color="error.main" mt={2}>{error}</Typography>}
      </form>
    </Paper>
  );
};

export default FormTambahUser;
