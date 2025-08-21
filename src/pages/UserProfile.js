import React, { useContext, useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Grid,
  Divider, Alert, Snackbar, Card, CardContent,
  Avatar, Stack
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import { AuthContext } from '../context/AuthContext';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import HeaderPimpinan from '../components/HeaderPimpinan';
import HeaderPresenter from '../components/HeaderPresenter';

const UserProfile = () => {
  const { userData } = useContext(AuthContext);
  const [enhancedUserData, setEnhancedUserData] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch additional presenter data if user is presenter
  useEffect(() => {
    const fetchPresenterData = async () => {
      if (userData?.role === 'presenter' && userData?.presenterId) {
        try {
          const presenterQuery = query(collection(db, 'presenter'), where('id', '==', userData.presenterId));
          const presenterSnapshot = await getDocs(presenterQuery);

          if (!presenterSnapshot.empty) {
            const presenterData = presenterSnapshot.docs[0].data();
            setEnhancedUserData({
              ...userData,
              nomorWA: presenterData.nomorWA,
              alamat: presenterData.alamat,
              idcode: presenterData.idcode
            });
          } else {
            setEnhancedUserData(userData);
          }
        } catch (error) {
          setEnhancedUserData(userData);
        }
      } else {
        setEnhancedUserData(userData);
      }
    };

    if (userData) {
      fetchPresenterData();
    }
  }, [userData]);

  const currentUserData = enhancedUserData || userData;

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showSnackbar('Semua field password harus diisi', 'error');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showSnackbar('Password baru dan konfirmasi password tidak sama', 'error');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showSnackbar('Password baru minimal 6 karakter', 'error');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      showSnackbar('Password baru harus berbeda dengan password lama', 'error');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;

      if (!user || !user.email) {
        showSnackbar('User tidak ditemukan', 'error');
        return;
      }

      // Reauthenticate user dengan password lama
      const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, passwordForm.newPassword);

      showSnackbar('Password berhasil diubah!', 'success');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error) {
      let errorMessage = 'Gagal mengubah password';

      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Password lama salah';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password terlalu lemah';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Silakan login ulang untuk mengubah password';
      }

      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatRole = (role) => {
    switch (role) {
      case 'pimpinan': return 'Pimpinan';
      case 'presenter': return 'Presenter';
      case 'pegawai': return 'Pegawai';
      default: return role;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Box>
      {currentUserData?.role === 'pimpinan' && <HeaderPimpinan />}
      {currentUserData?.role === 'presenter' && <HeaderPresenter />}

      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Profile Pengguna
        </Typography>

        <Grid container spacing={3}>
          {/* Profile Information */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                  <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
                    {getInitials(currentUserData?.namaLengkap)}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {currentUserData?.namaLengkap || 'Nama Tidak Tersedia'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {formatRole(currentUserData?.role)}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom startIcon={<PersonIcon />}>
                    Informasi Profile
                  </Typography>

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Nama Lengkap"
                        value={currentUserData?.namaLengkap || ''}
                        InputProps={{ readOnly: true }}
                        variant="outlined"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={currentUserData?.email || ''}
                        InputProps={{ readOnly: true }}
                        variant="outlined"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Role"
                        value={formatRole(currentUserData?.role) || ''}
                        InputProps={{ readOnly: true }}
                        variant="outlined"
                      />
                    </Grid>

                    {currentUserData?.role === 'presenter' && (
                      <>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Nomor WhatsApp"
                            value={currentUserData?.nomorWA || 'Tidak tersedia'}
                            InputProps={{ readOnly: true }}
                            variant="outlined"
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Alamat"
                            value={currentUserData?.alamat || 'Tidak tersedia'}
                            InputProps={{ readOnly: true }}
                            variant="outlined"
                            multiline
                            rows={2}
                          />
                        </Grid>
                      </>
                    )}

                    {currentUserData?.cabangOffice && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Kantor Cabang"
                          value={currentUserData.cabangOffice}
                          InputProps={{ readOnly: true }}
                          variant="outlined"
                        />
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Change Password */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LockIcon />
                  Ubah Password
                </Typography>

                <Box component="form" onSubmit={handlePasswordSubmit} sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Password Lama"
                        name="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        variant="outlined"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Password Baru"
                        name="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        required
                        variant="outlined"
                        helperText="Minimal 6 karakter"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Konfirmasi Password Baru"
                        name="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        variant="outlined"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{ mt: 2 }}
                      >
                        {loading ? 'Mengubah Password...' : 'Ubah Password'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default UserProfile;
