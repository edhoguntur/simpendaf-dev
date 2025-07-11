import React, { useState } from 'react';
import {
  Box, Button, TextField, Typography, Checkbox, FormControlLabel, Divider
} from '@mui/material';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { syncUserToFirestore } from '../utils/syncUserToFirestore';

const LoginPimpinan = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const q = query(collection(db, 'users'), where('uid', '==', user.uid));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError('Pengguna tidak ditemukan di database.');
        return;
      }

      const userData = snapshot.docs[0].data();
      if (userData.role !== 'pimpinan') {
        setError('Akses ditolak. Anda bukan pimpinan.');
        return;
      }

      navigate('/pimpinan/dashboard');
    } catch (err) {
      console.error(err);
      setError('Login gagal. Periksa kembali email dan password Anda.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userData = await syncUserToFirestore(user, 'pimpinan');
      if (!userData || userData.role !== 'pimpinan') {
        setError('Akses ditolak. Anda bukan pimpinan.');
        return;
      }

      navigate('/pimpinan/dashboard');
    } catch (err) {
      console.error(err);
      setError('Login Google gagal.');
    }
  };

  return (
    <Box sx={{
      maxWidth: 400, mx: 'auto', my: 8, p: 4, boxShadow: 3, borderRadius: 2,
      display: 'flex', flexDirection: 'column', gap: 2
    }}>
      <Typography variant="h5" align="center" fontWeight="bold">Login Pimpinan</Typography>

      <form onSubmit={handleLogin}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
          }
          label="Remember me"
        />
        <Button variant="contained" type="submit" fullWidth sx={{ mt: 1 }}>
          Sign in
        </Button>
      </form>

      <Divider>atau</Divider>

      <Button onClick={handleGoogleLogin} fullWidth variant="outlined" sx={{ textTransform: 'none' }}>
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          width={20}
          style={{ marginRight: 8 }}
        />
        Sign in with Google
      </Button>

      {error && <Typography color="error">{error}</Typography>}
    </Box>
  );
};

export default LoginPimpinan;