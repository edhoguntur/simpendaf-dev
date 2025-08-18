import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Chip, Button
} from '@mui/material';
import {
  School, HowToReg, TrendingUp, AccountBalance,
  CalendarToday, Person, Refresh
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import HeaderPresenter from '../components/HeaderPresenter';
import { AuthContext } from '../context/AuthContext';

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const StatistikPresenterIndividual = () => {
  const { userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [selectedBulan, setSelectedBulan] = useState('');
  const [selectedTahun, setSelectedTahun] = useState('');

  // Data statistik
  const [pendaftaranData, setPendaftaranData] = useState([]);
  const [daftarUlangData, setDaftarUlangData] = useState([]);

  // Helper function to parse Indonesian currency format
  const parseCurrency = (value) => {
    if (!value) return 0;
    // Remove all dots and parse as number
    const cleanValue = value.toString().replace(/\./g, '');
    return parseFloat(cleanValue) || 0;
  };

  // Generate static options for filter
  const allMonths = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
  const currentYear = new Date().getFullYear();
  const allYears = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => currentYear - i); // 2020 to current year, descending

  const fetchData = useCallback(async () => {
    if (!userData?.namaLengkap) return;

    setLoading(true);
    try {
      // Fetch data pendaftaran siswa untuk presenter ini
      const pendaftaranSnapshot = await getDocs(collection(db, 'pendaftaran_siswa'));
      const allPendaftaran = pendaftaranSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter data pendaftaran untuk presenter yang sedang login
      const myPendaftaran = allPendaftaran.filter(item => {
        const presenterNames = Array.isArray(item.presenter)
          ? item.presenter
          : [item.presenter];
        return presenterNames.includes(userData.namaLengkap);
      });

      // Fetch data daftar ulang
      const daftarUlangSnapshot = await getDocs(collection(db, 'daftar_ulang'));
      const allDaftarUlang = daftarUlangSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter daftar ulang berdasarkan nomor pendaftaran yang ada di myPendaftaran
      const myNomorPendaftaran = myPendaftaran.map(item => item.nomorPendaftaran);
      const myDaftarUlang = allDaftarUlang.filter(item =>
        myNomorPendaftaran.includes(item.nomorPendaftaran)
      );

      setPendaftaranData(myPendaftaran);
      setDaftarUlangData(myDaftarUlang);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [userData?.namaLengkap]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter data berdasarkan bulan dan tahun yang dipilih menggunakan useMemo
  const { filteredPendaftaran, filteredDaftarUlang, summaryStats } = useMemo(() => {
    const filterByDate = (data, dateField) => {
      return data.filter(item => {
        if (!item[dateField]) return false;

        const date = new Date(item[dateField]);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        const matchMonth = !selectedBulan || selectedBulan === '' || month === parseInt(selectedBulan);
        const matchYear = !selectedTahun || selectedTahun === '' || year === parseInt(selectedTahun);

        return matchMonth && matchYear;
      });
    };

    const filteredPendaftaran = filterByDate(pendaftaranData, 'tglDaftar');
    const filteredDaftarUlang = filterByDate(daftarUlangData, 'tglDaftarUlang');

    // Calculate summary statistics
    const totalPendaftaran = filteredPendaftaran.length;
    const totalDaftarUlang = filteredDaftarUlang.length;
    const totalBiayaPendaftaran = filteredPendaftaran.reduce((sum, item) =>
      sum + parseCurrency(item.totalBiayaPendaftaran), 0
    );
    const totalBiayaDaftarUlang = filteredDaftarUlang.reduce((sum, item) =>
      sum + parseCurrency(item.totalBiaya), 0
    );

    const summaryStats = {
      totalPendaftaran,
      totalDaftarUlang,
      totalBiayaPendaftaran,
      totalBiayaDaftarUlang
    };

    return { filteredPendaftaran, filteredDaftarUlang, summaryStats };
  }, [pendaftaranData, daftarUlangData, selectedBulan, selectedTahun]);

  // Group data by month for detailed breakdown
  const monthlyBreakdown = useMemo(() => {
    const breakdown = {};

    filteredPendaftaran.forEach(item => {
      const date = new Date(item.tglDaftar);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

      if (!breakdown[monthYear]) {
        breakdown[monthYear] = {
          monthYear,
          pendaftaran: 0,
          daftarUlang: 0,
          biayaPendaftaran: 0,
          biayaDaftarUlang: 0
        };
      }

      breakdown[monthYear].pendaftaran++;
      breakdown[monthYear].biayaPendaftaran += parseCurrency(item.totalBiayaPendaftaran);
    });

    filteredDaftarUlang.forEach(item => {
      const date = new Date(item.tglDaftarUlang);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

      if (!breakdown[monthYear]) {
        breakdown[monthYear] = {
          monthYear,
          pendaftaran: 0,
          daftarUlang: 0,
          biayaPendaftaran: 0,
          biayaDaftarUlang: 0
        };
      }

      breakdown[monthYear].daftarUlang++;
      breakdown[monthYear].biayaDaftarUlang += parseCurrency(item.totalBiaya);
    });

    return Object.values(breakdown).sort((a, b) => {
      const [monthA, yearA] = a.monthYear.split('/');
      const [monthB, yearB] = b.monthYear.split('/');
      return new Date(yearB, monthB - 1) - new Date(yearA, monthA - 1);
    });
  }, [filteredPendaftaran, filteredDaftarUlang]);

  if (loading) {
    return (
      <Box>
        <HeaderPresenter />
        <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <HeaderPresenter />
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Statistik Saya
        </Typography>

        {/* Info Filter Aktif */}
        {(selectedBulan || selectedTahun) && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
            <Typography variant="body2">
              📊 Filter Aktif:
              {selectedBulan && ` Bulan ${monthNames[selectedBulan - 1]}`}
              {selectedBulan && selectedTahun && ' - '}
              {selectedTahun && ` Tahun ${selectedTahun}`}
              {` | Menampilkan ${summaryStats.totalPendaftaran + summaryStats.totalDaftarUlang} data`}
            </Typography>
          </Paper>
        )}

        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Person sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              {userData?.namaLengkap}
            </Typography>
            <Chip
              label={userData?.role}
              color="primary"
              size="small"
              sx={{ ml: 2 }}
            />
          </Box>
        </Paper>

        {/* Cek jika tidak ada data sama sekali */}
        {pendaftaranData.length === 0 && daftarUlangData.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Belum ada data statistik
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Anda belum memiliki data pendaftaran atau daftar ulang mahasiswa.
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Filter Controls */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <CalendarToday sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ mr: 2 }}>Filter Periode:</Typography>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Bulan</InputLabel>
                <Select
                  value={selectedBulan}
                  onChange={(e) => setSelectedBulan(e.target.value)}
                  label="Bulan"
                >
                  <MenuItem value="">Semua Bulan</MenuItem>
                  {allMonths.map(month => (
                    <MenuItem key={month} value={month}>
                      {monthNames[month - 1]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Tahun</InputLabel>
                <Select
                  value={selectedTahun}
                  onChange={(e) => setSelectedTahun(e.target.value)}
                  label="Tahun"
                >
                  <MenuItem value="">Semua Tahun</MenuItem>
                  {allYears.map(year => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                size="small"
                startIcon={<Refresh />}
                onClick={() => {
                  setSelectedBulan('');
                  setSelectedTahun('');
                }}
                sx={{ ml: 1 }}
              >
                Reset Filter
              </Button>
            </Paper>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <School sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" color="primary" sx={{ fontSize: '0.9rem' }}>
                    Pendaftaran Baru
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {summaryStats.totalPendaftaran}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Mahasiswa
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <HowToReg sx={{ color: 'success.main', mr: 1 }} />
                  <Typography variant="h6" color="success.main" sx={{ fontSize: '0.9rem' }}>
                    Daftar Ulang
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {summaryStats.totalDaftarUlang}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Mahasiswa
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccountBalance sx={{ color: 'warning.main', mr: 1 }} />
                  <Typography variant="h6" color="warning.main" sx={{ fontSize: '0.9rem' }}>
                    Biaya Pendaftaran
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ fontSize: '1.5rem' }}>
                  Rp {summaryStats.totalBiayaPendaftaran.toLocaleString('id-ID')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUp sx={{ color: 'info.main', mr: 1 }} />
                  <Typography variant="h6" color="info.main" sx={{ fontSize: '0.9rem' }}>
                    Biaya Daftar Ulang
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ fontSize: '1.5rem' }}>
                  Rp {summaryStats.totalBiayaDaftarUlang.toLocaleString('id-ID')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Monthly Breakdown Table */}
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Rincian Per Bulan
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Periode</TableCell>
                  <TableCell align="center">Pendaftaran Baru</TableCell>
                  <TableCell align="center">Daftar Ulang</TableCell>
                  <TableCell align="right">Biaya Pendaftaran</TableCell>
                  <TableCell align="right">Biaya Daftar Ulang</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {monthlyBreakdown.map((item, index) => {
                  const [month, year] = item.monthYear.split('/');
                  const monthName = monthNames[parseInt(month) - 1];

                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {monthName} {year}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.pendaftaran}
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.daftarUlang}
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        Rp {item.biayaPendaftaran.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell align="right">
                        Rp {item.biayaDaftarUlang.toLocaleString('id-ID')}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {monthlyBreakdown.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Tidak ada data untuk periode yang dipilih
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Detail Data Lists */}
        <Grid container spacing={3}>
          {/* Pendaftaran Baru */}
          <Grid item xs={12} md={6}>
            <Paper>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Data Pendaftaran Baru ({filteredPendaftaran.length})
                </Typography>
              </Box>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>No. Pendaftaran</TableCell>
                      <TableCell>Nama</TableCell>
                      <TableCell>Tanggal</TableCell>
                      <TableCell align="right">Biaya</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPendaftaran.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.nomorPendaftaran}</TableCell>
                        <TableCell>{item.namaPendaftar}</TableCell>
                        <TableCell>{item.tglDaftar}</TableCell>
                        <TableCell align="right">
                          Rp {parseCurrency(item.totalBiayaPendaftaran).toLocaleString('id-ID')}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredPendaftaran.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Tidak ada data pendaftaran
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Daftar Ulang */}
          <Grid item xs={12} md={6}>
            <Paper>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Data Daftar Ulang ({filteredDaftarUlang.length})
                </Typography>
              </Box>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>No. Pendaftaran</TableCell>
                      <TableCell>Nama</TableCell>
                      <TableCell>Tanggal</TableCell>
                      <TableCell align="right">Biaya</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDaftarUlang.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.nomorPendaftaran}</TableCell>
                        <TableCell>{item.namaMahasiswa}</TableCell>
                        <TableCell>{item.tglDaftarUlang}</TableCell>
                        <TableCell align="right">
                          Rp {parseCurrency(item.totalBiaya).toLocaleString('id-ID')}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredDaftarUlang.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Tidak ada data daftar ulang
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
        </>
        )}
      </Box>
    </Box>
  );
};

export default StatistikPresenterIndividual;
