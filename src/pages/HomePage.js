import React, { useState } from 'react';
import {
  Box, Typography, Card, Button, Container, TextField,
  Checkbox, FormControlLabel, Divider
} from '@mui/material';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Login Pimpinan Component
const PimpinanLoginForm = () => {
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
      setError('Email atau password salah');
    }
  };

  return (
    <Card sx={{
      p: 3,
      height: 'fit-content',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: 3,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <Typography variant="h5" align="center" fontWeight="bold" sx={{ mb: 3, color: 'primary.main' }}>
        Login Pimpinan
      </Typography>

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

      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
    </Card>
  );
};

// Login Presenter Component
const PresenterLoginForm = () => {
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
      if (userData.role !== 'presenter') {
        setError('Akses ditolak. Anda bukan presenter.');
        return;
      }

      navigate('/presenter/dashboard');
    } catch (err) {
      setError('Login gagal. Periksa kembali email dan password Anda.');
    }
  };

  return (
    <Card sx={{
      p: 3,
      height: 'fit-content',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: 3,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <Typography variant="h5" align="center" fontWeight="bold" sx={{ mb: 3, color: 'secondary.main' }}>
        Login Presenter
      </Typography>

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

      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
    </Card>
  );
};

const HomePage = () => {
  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(120, 119, 198, 0.2) 0%, transparent 50%)',
        pointerEvents: 'none'
      }
    }}>
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4
        }}>
          {/* Header with Logo and Title */}
          <Box sx={{
            textAlign: 'center',
            mb: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {/* Logo Section */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 4,
              gap: 3,
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
              <Box sx={{
                p: 2,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
              }}>
                <img
                  src="/logo_atc.JPEG"
                  alt="ATC Logo"
                  style={{
                    width: '180px',
                    height: 'auto',
                    borderRadius: '8px'
                  }}
                />
              </Box>

              {/* University Style Title Layout */}
              <Box sx={{
                textAlign: { xs: 'center', sm: 'left' },
                maxWidth: '500px'
              }}>
                <Typography variant="h2" component="h1" sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                  fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                  lineHeight: 1.2,
                  letterSpacing: '0.5px'
                }}>
                  AERO TRAINING CENTRE
                </Typography>
                <Box sx={{
                  width: '80px',
                  height: '3px',
                  background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                  margin: { xs: '16px auto', sm: '16px 0' },
                  borderRadius: '2px'
                }} />
                <Typography variant="h4" sx={{
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontWeight: '500',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  fontSize: { xs: '1.5rem', sm: '1.8rem' },
                  letterSpacing: '1px'
                }}>
                  Sistem Informasi Pendaftaran Siswa
                </Typography>
              </Box>
            </Box>
          </Box>

        {/* Dual Login Forms */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 4,
          width: '100%',
          maxWidth: '900px',
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          <Box sx={{ flex: 1, maxWidth: { xs: '400px', md: 'none' } }}>
            <PimpinanLoginForm />
          </Box>

          {/* Vertical Divider */}
          <Box sx={{
            display: { xs: 'none', md: 'block' },
            height: '400px',
            width: '1px',
            bgcolor: 'divider',
            mx: 2
          }} />

          {/* Horizontal Divider for mobile */}
          <Divider sx={{
            display: { xs: 'block', md: 'none' },
            width: '100%',
            my: 2
          }} />

          <Box sx={{ flex: 1, maxWidth: { xs: '400px', md: 'none' } }}>
            <PresenterLoginForm />
          </Box>
        </Box>

        {/* Copyright Section */}
        <Box sx={{
          mt: 6,
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.8)'
        }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            © 2025 Aero Training Centre. All rights reserved.
          </Typography>
          <Typography variant="caption">
            Sistem Informasi Pendaftaran Siswa v1.0
          </Typography>
        </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
