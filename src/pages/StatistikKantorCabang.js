import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Button
} from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import HeaderPimpinan from '../components/HeaderPimpinan';

const StatistikKantorCabang = () => {
  const [loading, setLoading] = useState(true);
  const [kantorStats, setKantorStats] = useState([]);
  const [selectedKantor, setSelectedKantor] = useState('all');
  const [selectedBulan, setSelectedBulan] = useState('all');
  const [selectedTahun, setSelectedTahun] = useState('all');
  const [kantorList, setKantorList] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  const processKantorStatistics = (kantorData, presenterList, pendaftaranList) => {
    const stats = {};

    // Inisialisasi stats untuk setiap kantor
    kantorData.forEach(kantor => {
      stats[kantor.namaKantor] = {
        namaKantor: kantor.namaKantor,
        totalPendaftaran: 0,
        totalPresenter: 0,
        presenterList: [],
        pendaftaranPerBulan: {},
        pendaftaranDetail: [] // untuk menyimpan detail pendaftaran dengan tanggal
      };
    });

    // Hitung jumlah presenter per kantor
    presenterList.forEach(presenter => {
      const kantorNama = presenter.alamat || 'Tidak Diketahui';
      if (stats[kantorNama]) {
        stats[kantorNama].totalPresenter++;
        stats[kantorNama].presenterList.push(presenter.namaLengkap);
      }
    });

    // Hitung pendaftaran per kantor dan per bulan
    pendaftaranList.forEach(pendaftaran => {
      const presenterNames = Array.isArray(pendaftaran.presenter) ? pendaftaran.presenter : [];

      presenterNames.forEach(presenterName => {
        const presenter = presenterList.find(p => p.namaLengkap === presenterName);
        if (presenter) {
          const kantorNama = presenter.alamat || 'Tidak Diketahui';
          if (stats[kantorNama]) {
            // Ekstrak informasi tanggal
            const tanggalDaftar = new Date(pendaftaran.tglDaftar);
            const bulan = tanggalDaftar.getMonth() + 1;
            const tahun = tanggalDaftar.getFullYear();
            const bulanTahun = `${bulan}/${tahun}`;

            // Simpan detail pendaftaran
            stats[kantorNama].pendaftaranDetail.push({
              ...pendaftaran,
              bulan,
              tahun,
              tanggalDaftar
            });

            stats[kantorNama].totalPendaftaran++;

            // Statistik per bulan
            if (!stats[kantorNama].pendaftaranPerBulan[bulanTahun]) {
              stats[kantorNama].pendaftaranPerBulan[bulanTahun] = 0;
            }
            stats[kantorNama].pendaftaranPerBulan[bulanTahun]++;
          }
        }
      });
    });

    // Set available months (1-12) dan years (2020 sampai tahun sekarang)
    const currentYear = new Date().getFullYear();
    const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const allYears = [];
    for (let year = 2020; year <= currentYear; year++) {
      allYears.push(year);
    }

    setAvailableMonths(allMonths);
    setAvailableYears(allYears.reverse()); // reverse untuk menampilkan tahun terbaru dulu

    setKantorStats(Object.values(stats));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch data kantor
        const kantorSnapshot = await getDocs(collection(db, 'kantor'));
        const kantorData = kantorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setKantorList(kantorData);

        // Fetch data presenter
        const presenterSnapshot = await getDocs(collection(db, 'presenter'));
        const presenterList = presenterSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch data pendaftaran
        const pendaftaranSnapshot = await getDocs(collection(db, 'pendaftaran_siswa'));
        const pendaftaranList = pendaftaranSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Proses statistik berdasarkan kantor cabang
        processKantorStatistics(kantorData, presenterList, pendaftaranList);

      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getFilteredData = () => {
    let filteredStats = kantorStats;

    // Filter berdasarkan kantor
    if (selectedKantor !== 'all') {
      filteredStats = filteredStats.filter(stat => stat.namaKantor === selectedKantor);
    }

    // Filter berdasarkan bulan dan tahun
    if (selectedBulan !== 'all' || selectedTahun !== 'all') {
      filteredStats = filteredStats.map(kantor => {
        const filteredDetail = kantor.pendaftaranDetail.filter(pendaftaran => {
          const matchBulan = selectedBulan === 'all' || pendaftaran.bulan === parseInt(selectedBulan);
          const matchTahun = selectedTahun === 'all' || pendaftaran.tahun === parseInt(selectedTahun);
          return matchBulan && matchTahun;
        });

        return {
          ...kantor,
          totalPendaftaran: filteredDetail.length,
          pendaftaranDetail: filteredDetail
        };
      });
    }

    return filteredStats;
  };

  const getTotalPendaftaran = () => {
    return getFilteredData().reduce((total, kantor) => total + kantor.totalPendaftaran, 0);
  };

  const getTotalPresenter = () => {
    return getFilteredData().reduce((total, kantor) => total + kantor.totalPresenter, 0);
  };

  const getMonthName = (month) => {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return monthNames[month - 1];
  };

  const handleResetFilters = () => {
    setSelectedKantor('all');
    setSelectedBulan('all');
    setSelectedTahun('all');
  };

  if (loading) {
    return (
      <>
        <HeaderPimpinan />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <HeaderPimpinan />
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Statistik Pendaftaran Mahasiswa Baru per Kantor Cabang
        </Typography>

        {/* Info Period Filter */}
        {(selectedBulan !== 'all' || selectedTahun !== 'all') && (
          <Typography variant="h6" color="primary" gutterBottom>
            Periode: {selectedBulan !== 'all' ? getMonthName(parseInt(selectedBulan)) : 'Semua Bulan'} {selectedTahun !== 'all' ? selectedTahun : 'Semua Tahun'}
          </Typography>
        )}

        {/* Filter Kantor */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter Kantor</InputLabel>
                <Select
                  value={selectedKantor}
                  label="Filter Kantor"
                  onChange={(e) => setSelectedKantor(e.target.value)}
                >
                  <MenuItem value="all">Semua Kantor</MenuItem>
                  {kantorList.map(kantor => (
                    <MenuItem key={kantor.id} value={kantor.namaKantor}>
                      {kantor.namaKantor}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter Bulan</InputLabel>
                <Select
                  value={selectedBulan}
                  label="Filter Bulan"
                  onChange={(e) => setSelectedBulan(e.target.value)}
                >
                  <MenuItem value="all">Semua Bulan</MenuItem>
                  {availableMonths.map(month => (
                    <MenuItem key={month} value={month}>
                      {getMonthName(month)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter Tahun</InputLabel>
                <Select
                  value={selectedTahun}
                  label="Filter Tahun"
                  onChange={(e) => setSelectedTahun(e.target.value)}
                >
                  <MenuItem value="all">Semua Tahun</MenuItem>
                  {availableYears.map(year => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Reset Button */}
          {(selectedKantor !== 'all' || selectedBulan !== 'all' || selectedTahun !== 'all') && (
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={handleResetFilters}>
                Reset Filter
              </Button>
            </Box>
          )}
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Kantor
                </Typography>
                <Typography variant="h4">
                  {getFilteredData().length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Presenter
                </Typography>
                <Typography variant="h4">
                  {getTotalPresenter()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Pendaftaran Mahasiswa Baru
                </Typography>
                <Typography variant="h4">
                  {getTotalPendaftaran()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Rata-rata per Kantor
                </Typography>
                <Typography variant="h4">
                  {getFilteredData().length > 0 ? Math.round(getTotalPendaftaran() / getFilteredData().length) : 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Summary Chart - Pendaftaran per Kantor */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Pendaftaran Mahasiswa Baru per Kantor Cabang
              </Typography>
              <Box sx={{ mt: 2 }}>
                {getFilteredData().map((kantor, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{kantor.namaKantor}</Typography>
                      <Typography variant="body2">{kantor.totalPendaftaran} mahasiswa baru</Typography>
                    </Box>
                    <Box sx={{
                      width: '100%',
                      height: 8,
                      backgroundColor: '#f0f0f0',
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}>
                      <Box sx={{
                        width: `${Math.max((kantor.totalPendaftaran / Math.max(...getFilteredData().map(k => k.totalPendaftaran), 1)) * 100, 5)}%`,
                        height: '100%',
                        backgroundColor: '#1976d2',
                        borderRadius: 4
                      }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Summary Stats */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ringkasan Statistik
              </Typography>
              <Box sx={{ mt: 2 }}>
                {getFilteredData().map((kantor, index) => (
                  <Box key={index} sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1,
                    mb: 1,
                    backgroundColor: index % 2 === 0 ? '#f5f5f5' : 'white',
                    borderRadius: 1
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {kantor.namaKantor}
                    </Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="primary">
                        {kantor.totalPendaftaran} mahasiswa baru
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {kantor.totalPresenter} presenter
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Detail Table */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Detail Statistik Pendaftaran Mahasiswa Baru per Kantor
            {(selectedBulan !== 'all' || selectedTahun !== 'all') && (
              <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 2 }}>
                (Periode: {selectedBulan !== 'all' ? getMonthName(parseInt(selectedBulan)) : 'Semua Bulan'} {selectedTahun !== 'all' ? selectedTahun : 'Semua Tahun'})
              </Typography>
            )}
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nama Kantor</TableCell>
                  <TableCell align="center">Total Presenter</TableCell>
                  <TableCell align="center">Total Pendaftaran Mahasiswa Baru</TableCell>
                  <TableCell align="center">Rata-rata per Presenter</TableCell>
                  <TableCell>Presenter</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredData().map((kantor, index) => (
                  <TableRow key={index}>
                    <TableCell>{kantor.namaKantor}</TableCell>
                    <TableCell align="center">{kantor.totalPresenter}</TableCell>
                    <TableCell align="center">{kantor.totalPendaftaran}</TableCell>
                    <TableCell align="center">
                      {kantor.totalPresenter > 0 ? Math.round(kantor.totalPendaftaran / kantor.totalPresenter) : 0}
                    </TableCell>
                    <TableCell>
                      {kantor.presenterList.join(', ') || 'Tidak ada presenter'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </>
  );
};

export default StatistikKantorCabang;
