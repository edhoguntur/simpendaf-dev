import React from 'react';
import { Box, Typography, Card, CardContent, Button, Grid, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AdminPanelSettings, Person } from '@mui/icons-material';

const HomePage = () => {
  const navigate = useNavigate();

  const loginOptions = [
    {
      title: 'Login Pimpinan',
      description: 'Akses untuk pimpinan dengan kontrol penuh sistem',
      icon: <AdminPanelSettings sx={{ fontSize: 48, color: 'primary.main' }} />,
      path: '/login-pimpinan',
      color: 'primary.main'
    },
    {
      title: 'Login Presenter',
      description: 'Akses untuk presenter yang mengelola pendaftaran',
      icon: <Person sx={{ fontSize: 48, color: 'secondary.main' }} />,
      path: '/login-presenter',
      color: 'secondary.main'
    }
  ];

  return (
    <Container maxWidth="md">
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        py: 4
      }}>
        <Typography variant="h3" component="h1" align="center" gutterBottom>
          Sistem Pendaftaran
        </Typography>
        <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 6 }}>
          Silakan pilih jenis login sesuai dengan role Anda
        </Typography>

        <Grid container spacing={4} justifyContent="center">
          {loginOptions.map((option, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                  }
                }}
                onClick={() => navigate(option.path)}
              >
                <CardContent sx={{
                  textAlign: 'center',
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minHeight: 250
                }}>
                  <Box sx={{ mb: 3 }}>
                    {option.icon}
                  </Box>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ color: option.color }}>
                    {option.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                    {option.description}
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: option.color,
                      '&:hover': {
                        bgcolor: option.color,
                        opacity: 0.9
                      }
                    }}
                  >
                    Masuk
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default HomePage;
