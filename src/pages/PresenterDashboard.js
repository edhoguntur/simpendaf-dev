import React, { useContext } from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import HeaderPresenter from '../components/HeaderPresenter';
import SchoolIcon from '@mui/icons-material/School';
import { Article } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PresenterDashboard = () => {
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Pendaftaran Siswa',
      description: 'Kelola pendaftaran mahasiswa baru',
      icon: <SchoolIcon fontSize="large" color="primary" />,
      path: '/presenter/pendaftaran-siswa'
    },
    {
      title: 'Daftar Ulang',
      description: 'Kelola daftar ulang mahasiswa lama',
      icon: <Article fontSize="large" color="primary" />,
      path: '/presenter/daftar-ulang'
    }
  ];

  return (
    <>
      <HeaderPresenter />
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard Presenter
        </Typography>

        {userData && (
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Selamat datang, {userData.namaLengkap}
          </Typography>
        )}

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {menuItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
                onClick={() => navigate(item.path)}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>
                    {item.icon}
                  </Box>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  );
};

export default PresenterDashboard;
