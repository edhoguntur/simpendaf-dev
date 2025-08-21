import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Button
} from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import HeaderPimpinan from '../components/HeaderPimpinan';

const StatistikPresenter = () => {
  const [loading, setLoading] = useState(true);
  const [presenterStats, setPresenterStats] = useState([]);
  const [selectedPresenter, setSelectedPresenter] = useState('all');
  const [selectedBulan, setSelectedBulan] = useState('all');
  const [selectedTahun, setSelectedTahun] = useState('all');
  const [presenterList, setPresenterList] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  const processPresenterStatistics = (presenterList, pendaftaranList, daftarUlangList = []) => {
    const stats = {};

    // Helper function untuk normalisasi nama
    const normalizeString = (str) => str?.trim().toLowerCase().replace(/\s+/g, ' ') || '';

    // Inisialisasi stats untuk setiap presenter
    presenterList.forEach(presenter => {
      const normalizedName = normalizeString(presenter.namaLengkap);
      stats[presenter.namaLengkap] = {
        namaPresenter: presenter.namaLengkap,
        normalizedName,
        alamat: presenter.alamat || 'Tidak Diketahui',
        totalPendaftaran: 0,
        totalDaftarUlang: 0,
        pendaftaranPerBulan: {},
        daftarUlangPerBulan: {},
        pendaftaranDetail: [],
        daftarUlangDetail: []
      };
    });

    // Hitung pendaftaran per presenter dan per bulan
    pendaftaranList.forEach(pendaftaran => {
      const presenterNames = Array.isArray(pendaftaran.presenter) ? pendaftaran.presenter : [pendaftaran.presenter];

      presenterNames.forEach(presenterName => {
        if (presenterName && stats[presenterName]) {
          // Ekstrak informasi tanggal
          const tanggalDaftar = new Date(pendaftaran.tglDaftar);
          const bulan = tanggalDaftar.getMonth() + 1;
          const tahun = tanggalDaftar.getFullYear();
          const bulanTahun = `${bulan}/${tahun}`;

          // Simpan detail pendaftaran
          stats[presenterName].pendaftaranDetail.push({
            ...pendaftaran,
            bulan,
            tahun,
            tanggalDaftar
          });

          stats[presenterName].totalPendaftaran++;

          // Statistik per bulan
          if (!stats[presenterName].pendaftaranPerBulan[bulanTahun]) {
            stats[presenterName].pendaftaranPerBulan[bulanTahun] = 0;
          }
          stats[presenterName].pendaftaranPerBulan[bulanTahun]++;
        }
      });
    });

    // Hitung daftar ulang per presenter dan per bulan
    // Buat map nomor pendaftaran ke presenter untuk fallback
    const pendaftaranToPresenter = {};
    pendaftaranList.forEach(pendaftaran => {
      if (pendaftaran.nomorPendaftaran && pendaftaran.presenter) {
        pendaftaranToPresenter[pendaftaran.nomorPendaftaran] = pendaftaran.presenter;
      }
    });

    daftarUlangList.forEach((daftarUlang) => {
      // Validasi: hanya hitung jika ada DU Tahap 1 atau DU Tahap 2 dengan tanggal yang terisi
      const hasDU1 = daftarUlang.duTahap1 && daftarUlang.tglDU1;
      const hasDU2 = daftarUlang.duTahap2 && daftarUlang.tglDU2;

      // Skip jika tidak memiliki data DU yang valid
      if (!hasDU1 && !hasDU2) {
        return;
      }

      // Cara 1: Gunakan field presenter langsung dari daftar ulang
      let presenterSource = daftarUlang.presenter;

      // Cara 2: Jika tidak ada presenter di daftar ulang, cari dari data pendaftaran
      if (!presenterSource && daftarUlang.nomorPendaftaran) {
        presenterSource = pendaftaranToPresenter[daftarUlang.nomorPendaftaran];
      }

      const presenterNames = Array.isArray(presenterSource) ? presenterSource : [presenterSource];

      presenterNames.forEach(presenterName => {
        // Cari presenter dengan exact match terlebih dahulu
        let matchedPresenterKey = null;
        if (presenterName && stats[presenterName]) {
          matchedPresenterKey = presenterName;
        } else if (presenterName) {
          // Jika tidak exact match, coba fuzzy match berdasarkan normalisasi nama
          const normalizedSearchName = normalizeString(presenterName);
          matchedPresenterKey = Object.keys(stats).find(key =>
            stats[key].normalizedName === normalizedSearchName
          );
        }

        if (matchedPresenterKey && stats[matchedPresenterKey]) {
          // Ekstrak informasi tanggal - prioritas tglDU1, fallback ke tglDU2
          let tanggalDU;
          if (daftarUlang.duTahap1 && daftarUlang.tglDU1) {
            tanggalDU = daftarUlang.tglDU1;
          } else if (daftarUlang.duTahap2 && daftarUlang.tglDU2) {
            tanggalDU = daftarUlang.tglDU2;
          } else {
            tanggalDU = daftarUlang.timestamp?.toDate?.() || new Date();
          }

          const daftarUlangDate = new Date(tanggalDU);
          const bulan = daftarUlangDate.getMonth() + 1;
          const tahun = daftarUlangDate.getFullYear();
          const bulanTahun = `${bulan}/${tahun}`;

          // Simpan detail daftar ulang
          stats[matchedPresenterKey].daftarUlangDetail.push({
            ...daftarUlang,
            bulan,
            tahun,
            tanggalDaftarUlang: daftarUlangDate
          });

          stats[matchedPresenterKey].totalDaftarUlang++;

          // Statistik per bulan
          if (!stats[matchedPresenterKey].daftarUlangPerBulan[bulanTahun]) {
            stats[matchedPresenterKey].daftarUlangPerBulan[bulanTahun] = 0;
          }
          stats[matchedPresenterKey].daftarUlangPerBulan[bulanTahun]++;
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

    setPresenterStats(Object.values(stats));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch data presenter
        const presenterSnapshot = await getDocs(collection(db, 'presenter'));
        const presenterData = presenterSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPresenterList(presenterData);

        // Fetch data pendaftaran
        const pendaftaranSnapshot = await getDocs(collection(db, 'pendaftaran_siswa'));
        const pendaftaranList = pendaftaranSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch data daftar ulang
        const daftarUlangSnapshot = await getDocs(collection(db, 'daftar_ulang'));
        const daftarUlangList = daftarUlangSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Proses statistik berdasarkan presenter dengan data daftar ulang
        processPresenterStatistics(presenterData, pendaftaranList, daftarUlangList);

      } catch (error) {
        // Error handling sudah ditangani di UI dengan loading state
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getFilteredData = () => {
    let filteredStats = presenterStats;

    // Filter berdasarkan presenter
    if (selectedPresenter !== 'all') {
      filteredStats = filteredStats.filter(stat => stat.namaPresenter === selectedPresenter);
    }

    // Filter berdasarkan bulan dan tahun
    if (selectedBulan !== 'all' || selectedTahun !== 'all') {
      filteredStats = filteredStats.map(presenter => {
        const filteredPendaftaranDetail = presenter.pendaftaranDetail.filter(pendaftaran => {
          const matchBulan = selectedBulan === 'all' || pendaftaran.bulan === parseInt(selectedBulan);
          const matchTahun = selectedTahun === 'all' || pendaftaran.tahun === parseInt(selectedTahun);
          return matchBulan && matchTahun;
        });

        const filteredDaftarUlangDetail = presenter.daftarUlangDetail.filter(daftarUlang => {
          const matchBulan = selectedBulan === 'all' || daftarUlang.bulan === parseInt(selectedBulan);
          const matchTahun = selectedTahun === 'all' || daftarUlang.tahun === parseInt(selectedTahun);
          return matchBulan && matchTahun;
        });

        return {
          ...presenter,
          totalPendaftaran: filteredPendaftaranDetail.length,
          totalDaftarUlang: filteredDaftarUlangDetail.length,
          pendaftaranDetail: filteredPendaftaranDetail,
          daftarUlangDetail: filteredDaftarUlangDetail
        };
      });
    }

    return filteredStats;
  };

  const getTotalPendaftaran = () => {
    return getFilteredData().reduce((total, presenter) => total + presenter.totalPendaftaran, 0);
  };

  const getTotalPresenter = () => {
    return getFilteredData().filter(presenter => presenter.totalPendaftaran > 0).length;
  };

  const getTotalDaftarUlang = () => {
    return getFilteredData().reduce((total, presenter) => total + presenter.totalDaftarUlang, 0);
  };

  const getKonversiRate = () => {
    const totalPendaftaran = getTotalPendaftaran();
    const totalDaftarUlang = getTotalDaftarUlang();
    return totalPendaftaran > 0 ? ((totalDaftarUlang / totalPendaftaran) * 100).toFixed(1) : 0;
  };

  const getMonthName = (month) => {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return monthNames[month - 1];
  };

  const handleResetFilters = () => {
    setSelectedPresenter('all');
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
          Statistik Perolehan Presenter
        </Typography>

        {/* Info Period Filter */}
        {(selectedBulan !== 'all' || selectedTahun !== 'all') && (
          <Typography variant="h6" color="primary" gutterBottom>
            Periode: {selectedBulan !== 'all' ? getMonthName(parseInt(selectedBulan)) : 'Semua Bulan'} {selectedTahun !== 'all' ? selectedTahun : 'Semua Tahun'}
          </Typography>
        )}

        {/* Filter */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter Presenter</InputLabel>
                <Select
                  value={selectedPresenter}
                  label="Filter Presenter"
                  onChange={(e) => setSelectedPresenter(e.target.value)}
                >
                  <MenuItem value="all">Semua Presenter</MenuItem>
                  {presenterList.map(presenter => (
                    <MenuItem key={presenter.id} value={presenter.namaLengkap}>
                      {presenter.namaLengkap}
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
          {(selectedPresenter !== 'all' || selectedBulan !== 'all' || selectedTahun !== 'all') && (
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={handleResetFilters}>
                Reset Filter
              </Button>
            </Box>
          )}
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Presenter
                </Typography>
                <Typography variant="h4">
                  {getFilteredData().length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Presenter Aktif
                </Typography>
                <Typography variant="h4">
                  {getTotalPresenter()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Pendaftaran
                </Typography>
                <Typography variant="h4">
                  {getTotalPendaftaran()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Daftar Ulang
                </Typography>
                <Typography variant="h4">
                  {getTotalDaftarUlang()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Konversi Rate
                </Typography>
                <Typography variant="h4">
                  {getKonversiRate()}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Summary Chart - Pendaftaran per Presenter */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Perolehan Pendaftaran dan Daftar Ulang per Presenter
              </Typography>
              <Box sx={{ mt: 2 }}>
                {getFilteredData()
                  .sort((a, b) => b.totalPendaftaran - a.totalPendaftaran)
                  .slice(0, 10) // Top 10 presenter
                  .map((presenter, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">{presenter.namaPresenter}</Typography>
                      <Typography variant="body2">
                        {presenter.totalPendaftaran} pendaftaran | {presenter.totalDaftarUlang} daftar ulang
                      </Typography>
                    </Box>

                    {/* Bar untuk Pendaftaran */}
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">Pendaftaran</Typography>
                      <Box sx={{
                        width: '100%',
                        height: 6,
                        backgroundColor: '#f0f0f0',
                        borderRadius: 3,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{
                          width: `${Math.max((presenter.totalPendaftaran / Math.max(...getFilteredData().map(p => p.totalPendaftaran), 1)) * 100, 3)}%`,
                          height: '100%',
                          backgroundColor: '#1976d2',
                          borderRadius: 3
                        }} />
                      </Box>
                    </Box>

                    {/* Bar untuk Daftar Ulang */}
                    <Box>
                      <Typography variant="caption" color="text.secondary">Daftar Ulang</Typography>
                      <Box sx={{
                        width: '100%',
                        height: 6,
                        backgroundColor: '#f0f0f0',
                        borderRadius: 3,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{
                          width: `${Math.max((presenter.totalDaftarUlang / Math.max(...getFilteredData().map(p => p.totalPendaftaran), 1)) * 100, 2)}%`,
                          height: '100%',
                          backgroundColor: '#4caf50',
                          borderRadius: 3
                        }} />
                      </Box>
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
                Top 5 Presenter
              </Typography>
              <Box sx={{ mt: 2 }}>
                {getFilteredData()
                  .sort((a, b) => b.totalPendaftaran - a.totalPendaftaran)
                  .slice(0, 5)
                  .map((presenter, index) => {
                    const konversiRate = presenter.totalPendaftaran > 0
                      ? ((presenter.totalDaftarUlang / presenter.totalPendaftaran) * 100).toFixed(1)
                      : 0;

                    return (
                      <Box key={index} sx={{
                        p: 2,
                        mb: 2,
                        backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                        borderRadius: 2,
                        border: '1px solid #e0e0e0'
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              #{index + 1} {presenter.namaPresenter}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {presenter.alamat}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Box sx={{ textAlign: 'center', flex: 1 }}>
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                              {presenter.totalPendaftaran}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Pendaftaran
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center', flex: 1 }}>
                            <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                              {presenter.totalDaftarUlang}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Daftar Ulang
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center', flex: 1 }}>
                            <Typography variant="h6" color="warning.main" sx={{ fontWeight: 'bold' }}>
                              {konversiRate}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Konversi
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Detail Table */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Detail Statistik per Presenter
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
                  <TableCell>No</TableCell>
                  <TableCell>Nama Presenter</TableCell>
                  <TableCell>Alamat/Kantor</TableCell>
                  <TableCell align="center">Total Pendaftaran</TableCell>
                  <TableCell align="center">Total Daftar Ulang</TableCell>
                  <TableCell align="center">Konversi (%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredData()
                  .sort((a, b) => b.totalPendaftaran - a.totalPendaftaran)
                  .map((presenter, index) => {
                    const konversiRate = presenter.totalPendaftaran > 0
                      ? ((presenter.totalDaftarUlang / presenter.totalPendaftaran) * 100).toFixed(1)
                      : 0;

                    return (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{presenter.namaPresenter}</TableCell>
                        <TableCell>{presenter.alamat}</TableCell>
                        <TableCell align="center">{presenter.totalPendaftaran}</TableCell>
                        <TableCell align="center">{presenter.totalDaftarUlang}</TableCell>
                        <TableCell align="center">{konversiRate}%</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </>
  );
};

export default StatistikPresenter;
