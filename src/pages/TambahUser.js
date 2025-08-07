import React, { useContext, useEffect, useState } from 'react';
import {
  Box, TextField, Button, Typography, MenuItem,
  Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { db, auth } from '../firebase';
import {
  collection, addDoc, getDocs, deleteDoc, updateDoc, doc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import HeaderPimpinan from '../components/HeaderPimpinan';

const TambahUser = () => {
  const { userData, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    namaLengkap: '',
    role: 'pegawai',
    cabangOffice: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [users, setUsers] = useState([]);
  const [kantorList, setKantorList] = useState([]);

  useEffect(() => {
    if (!loading && (!userData || userData.role !== 'pimpinan')) {
      navigate('/login-pimpinan');
    }
  }, [loading, userData, navigate]);

  useEffect(() => {
    fetchUsers();
    fetchKantor();
  }, []);

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setUsers(data);
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
        await updateDoc(doc(db, 'users', editingId), {
          email: form.email,
          namaLengkap: form.namaLengkap,
          role: form.role,
          cabangOffice: form.cabangOffice
        });
      } else {
        // ✅ Buat akun Auth Firebase
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);

        // ✅ Simpan ke Firestore
        await addDoc(collection(db, 'users'), {
          email: form.email,
          namaLengkap: form.namaLengkap,
          role: form.role,
          cabangOffice: form.cabangOffice,
          uid: cred.user.uid
        });
      }

      setForm({ email: '', password: '', namaLengkap: '', role: 'pegawai', cabangOffice: '' });
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      console.error('❌ Gagal simpan user:', err);
      alert('Terjadi kesalahan saat menambahkan user.');
    }
  };

  const handleEdit = (user) => {
    setForm({
      email: user.email,
      password: '', // password tidak bisa ditampilkan (keamanan)
      namaLengkap: user.namaLengkap,
      role: user.role,
      cabangOffice: user.cabangOffice
    });
    setEditingId(user.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus user ini?')) {
      await deleteDoc(doc(db, 'users', id));
      fetchUsers();
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <Box>
      <HeaderPimpinan />
      <Box sx={{ display: 'flex', gap: 2, p: 4 }}>
        {/* Form User */}
        <Paper sx={{ p: 3, width: '40%' }}>
          <Typography variant="h6" gutterBottom>
            {editingId ? 'Edit User' : 'Tambah User'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email" name="email" value={form.email}
              onChange={handleChange} fullWidth margin="normal" required
            />
            {!editingId && (
              <TextField
                label="Password" name="password" type="password"
                value={form.password} onChange={handleChange}
                fullWidth margin="normal" required
              />
            )}
            <TextField
              label="Nama Lengkap" name="namaLengkap"
              value={form.namaLengkap} onChange={handleChange}
              fullWidth margin="normal" required
            />
            <TextField
              select
              label="Cabang Office"
              name="cabangOffice"
              value={form.cabangOffice}
              onChange={handleChange}
              fullWidth margin="normal"
              required
            >
              <MenuItem value="">Pilih Kantor</MenuItem>
              {kantorList.map(k => (
                <MenuItem key={k.id} value={k.namaKantor}>{k.namaKantor}</MenuItem>
              ))}
            </TextField>
            <TextField
              select label="Role" name="role" value={form.role}
              onChange={handleChange} fullWidth margin="normal"
            >
              <MenuItem value="pegawai">Pegawai</MenuItem>
              <MenuItem value="pimpinan">Pimpinan Cabang</MenuItem>
            </TextField>

            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              {editingId ? 'Simpan Perubahan' : 'Tambah User'}
            </Button>

            {editingId && (
              <Button
                onClick={() => {
                  setEditingId(null);
                  setForm({ email: '', password: '', namaLengkap: '', role: 'pegawai', cabangOffice: '' });
                }}
                fullWidth sx={{ mt: 1 }}
              >
                Batal Edit
              </Button>
            )}
          </form>
        </Paper>

        {/* Tabel User */}
        <Paper sx={{ p: 2, width: '60%', overflowX: 'auto' }}>
          <Typography variant="h6" gutterBottom>Daftar User</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Nama</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Cabang</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.namaLengkap}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.cabangOffice}</TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleEdit(user)}><Edit fontSize="small" /></IconButton>
                      <IconButton onClick={() => handleDelete(user.id)}><Delete fontSize="small" /></IconButton>
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

export default TambahUser;
