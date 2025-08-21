import React, { useContext, useEffect, useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button,
  TableContainer, Table, TableHead, TableBody,
  TableRow, TableCell, IconButton, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Snackbar, Chip
} from '@mui/material';
import { Edit, Delete, HowToReg } from '@mui/icons-material';
import { db } from '../firebase';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  collection, addDoc, getDocs, deleteDoc, updateDoc, doc
} from 'firebase/firestore';
import HeaderPimpinan from '../components/HeaderPimpinan';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Firebase config untuk secondary auth instance
const secondaryAppConfig = {
  // Gunakan config Firebase yang sama dengan aplikasi utama
  // Pastikan untuk menggunakan config yang sama dari firebase.js
  apiKey: "AIzaSyCPtAKHK99V3CSmUZcfiyOyJxnRiIg0Wm8",
  authDomain: "pendaftaran-b6b23.firebaseapp.com",
  projectId: "pendaftaran-b6b23",
  storageBucket: "pendaftaran-b6b23.firebasestorage.app",
  messagingSenderId: "894764613170",
  appId: "1:894764613170:web:a5c7ef258b488f9d5b462b",
  measurementId: "G-T18GZSV9Y0"
};

// Initialize secondary Firebase app
const secondaryApp = initializeApp(secondaryAppConfig, "secondary");
const secondaryAuth = getAuth(secondaryApp);

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
  const [kantorList, setKantorList] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // States untuk dialog create user
  const [openCreateUserDialog, setOpenCreateUserDialog] = useState(false);
  const [selectedPresenter, setSelectedPresenter] = useState(null);
  const [userPassword, setUserPassword] = useState('');

  // States untuk notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (!loading && (!userData || userData.role !== 'pimpinan')) {
      navigate('/login-pimpinan');
    }
  }, [loading, userData, navigate]);

  useEffect(() => {
    fetchData();
    fetchKantor();
    fetchUsers();
  }, []);

  const fetchData = async () => {
    const snapshot = await getDocs(collection(db, 'presenter'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPresenterList(data);
  };

  const fetchKantor = async () => {
    const snapshot = await getDocs(collection(db, 'kantor'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setKantorList(data);
  };

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setUsersList(data);
  };

  // Helper function untuk mengecek apakah presenter sudah menjadi user
  const isPresenterAlreadyUser = (presenter) => {
    return usersList.some(user =>
      user.email === presenter.email || user.presenterId === presenter.id
    );
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
      showSnackbar('Data presenter berhasil disimpan!', 'success');
    } catch (err) {
      showSnackbar('Gagal menyimpan data presenter', 'error');
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
    try {
      // Cari presenter yang akan dihapus
      const presenterToDelete = presenterList.find(p => p.id === id);

      if (!presenterToDelete) {
        showSnackbar('Presenter tidak ditemukan', 'error');
        return;
      }

      // Cek apakah presenter sudah menjadi user
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const existingUser = usersSnapshot.docs.find(doc => {
        const userData = doc.data();
        return userData.email === presenterToDelete.email || userData.presenterId === id;
      });

      if (existingUser) {
        showSnackbar(
          `Tidak dapat menghapus presenter ${presenterToDelete.namaLengkap}. Presenter ini sudah menjadi user. Hapus user terlebih dahulu.`,
          'error'
        );
        return;
      }

      // Jika tidak ada user yang terkait, lanjutkan penghapusan
      if (window.confirm(`Yakin ingin menghapus presenter ${presenterToDelete.namaLengkap}?`)) {
        await deleteDoc(doc(db, 'presenter', id));
        fetchData();
        showSnackbar('Presenter berhasil dihapus!', 'success');
      }
    } catch (err) {
      showSnackbar('Gagal menghapus presenter', 'error');
    }
  };

  // Handle create user dialog
  const handleCreateUserClick = (presenter) => {
    // Cek apakah presenter sudah menjadi user
    if (isPresenterAlreadyUser(presenter)) {
      showSnackbar(`${presenter.namaLengkap} sudah menjadi user`, 'warning');
      return;
    }

    setSelectedPresenter(presenter);
    setUserPassword('');
    setOpenCreateUserDialog(true);
  };

  const handleCreateUser = async () => {
    if (!selectedPresenter || !userPassword.trim()) {
      showSnackbar('Password tidak boleh kosong', 'error');
      return;
    }

    try {
      // Cek apakah email sudah ada di collection users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const existingUser = usersSnapshot.docs.find(doc =>
        doc.data().email === selectedPresenter.email
      );

      if (existingUser) {
        showSnackbar('Email sudah terdaftar sebagai user', 'error');
        return;
      }

      // Create user dengan secondary auth instance (tidak akan logout user saat ini)
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        selectedPresenter.email,
        userPassword
      );

      // Simpan data user ke Firestore dengan role default "presenter"
      await addDoc(collection(db, 'users'), {
        email: selectedPresenter.email,
        namaLengkap: selectedPresenter.namaLengkap,
        role: 'presenter',
        cabangOffice: selectedPresenter.alamat,
        uid: userCredential.user.uid,
        createdFrom: 'presenter',
        presenterId: selectedPresenter.id
      });

      // Sign out dari secondary auth untuk membersihkan session
      await secondaryAuth.signOut();

      // Refresh data users untuk memperbarui status di tabel
      fetchUsers();

      setOpenCreateUserDialog(false);
      showSnackbar(`Berhasil membuat user untuk ${selectedPresenter.namaLengkap}!`, 'success');

    } catch (error) {
      let errorMessage = 'Gagal membuat user';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email sudah digunakan untuk akun lain';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password terlalu lemah (minimal 6 karakter)';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid';
      }

      showSnackbar(errorMessage, 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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
            <TextField
              label="ID"
              name="idcode"
              fullWidth
              margin="normal"
              value={form.idcode}
              onChange={handleChange}
              required
            />
            <TextField
              label="Nama Lengkap"
              name="namaLengkap"
              fullWidth
              margin="normal"
              value={form.namaLengkap}
              onChange={handleChange}
              required
            />
            <TextField
              label="Nomor WA"
              name="nomorWA"
              fullWidth
              margin="normal"
              value={form.nomorWA}
              onChange={handleChange}
              required
            />
            <TextField
              select
              label="Kantor"
              name="alamat"
              fullWidth
              margin="normal"
              value={form.alamat}
              onChange={handleChange}
              required
            >
              <MenuItem value="">Pilih Kantor</MenuItem>
              {kantorList.map((k) => (
                <MenuItem key={k.id} value={k.namaKantor}>{k.namaKantor}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Email"
              name="email"
              type="email"
              fullWidth
              margin="normal"
              value={form.email}
              onChange={handleChange}
              required
            />
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
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {presenterList.map((item, index) => {
                  const isUser = isPresenterAlreadyUser(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.idcode}</TableCell>
                      <TableCell>{item.namaLengkap}</TableCell>
                      <TableCell>{item.nomorWA}</TableCell>
                      <TableCell>{item.alamat}</TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>
                        {isUser ? (
                          <Chip label="User" size="small" color="success" />
                        ) : (
                          <Chip label="Presenter" size="small" color="default" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => handleEdit(item)}
                          title="Edit Presenter"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(item.id)}
                          title="Hapus Presenter"
                          disabled={isUser}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleCreateUserClick(item)}
                          title="Jadikan User"
                          color="primary"
                          disabled={isUser}
                        >
                          <HowToReg fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Dialog Create User */}
      <Dialog
        open={openCreateUserDialog}
        onClose={() => setOpenCreateUserDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Buat Akun User untuk {selectedPresenter?.namaLengkap}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Email: {selectedPresenter?.email}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Role: Presenter (default)
          </Typography>
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={userPassword}
            onChange={(e) => setUserPassword(e.target.value)}
            margin="normal"
            required
            helperText="Minimal 6 karakter"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateUserDialog(false)}>
            Batal
          </Button>
          <Button
            onClick={handleCreateUser}
            variant="contained"
            disabled={!userPassword.trim()}
          >
            Buat User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar untuk notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DataPresenter;
