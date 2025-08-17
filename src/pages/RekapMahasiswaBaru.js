import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Button
} from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import HeaderPimpinan from '../components/HeaderPimpinan';

const RekapMahasiswaBaru = () => {
  const [loading, setLoading] = useState(true);
  const [rekapData, setRekapData] = useState([]);
  const [selectedTahun, setSelectedTahun] = useState('all');
  const [selectedJurusan, setSelectedJurusan] = useState('all');
  const [availableYears, setAvailableYears] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);

  const processRekapData = (pendaftaranList, jurusanData) => {
    const rekap = {};
    const years = new Set();

    // Set jurusan list terlebih dahulu untuk memastikan semua jurusan tersedia di filter
    setJurusanList(jurusanData);

    // Inisialisasi rekap untuk setiap kombinasi tahun dan jurusan
    pendaftaranList.forEach(pendaftaran => {
      if (pendaftaran.tglDaftar && pendaftaran.jurusan) {
        const tahun = new Date(pendaftaran.tglDaftar).getFullYear();
        years.add(tahun);

        if (!rekap[tahun]) {
          rekap[tahun] = {};
        }

        if (!rekap[tahun][pendaftaran.jurusan]) {
          rekap[tahun][pendaftaran.jurusan] = {
            tahun,
            jurusan: pendaftaran.jurusan,
            totalMahasiswa: 0,
            pendaftaranDetail: []
          };
        }

        rekap[tahun][pendaftaran.jurusan].totalMahasiswa++;
        rekap[tahun][pendaftaran.jurusan].pendaftaranDetail.push(pendaftaran);
      }
    });

    // Set available years (2020 sampai tahun sekarang)
    const currentYear = new Date().getFullYear();
    const allYears = [];
    for (let year = 2020; year <= currentYear; year++) {
      allYears.push(year);
    }

    setAvailableYears(allYears.reverse()); // reverse untuk menampilkan tahun terbaru dulu

    // Convert nested object to flat array
    const flatData = [];
    Object.keys(rekap).forEach(tahun => {
      Object.keys(rekap[tahun]).forEach(jurusan => {
        flatData.push(rekap[tahun][jurusan]);
      });
    });

    setRekapData(flatData);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch data jurusan
        const jurusanSnapshot = await getDocs(collection(db, 'jurusan'));
        const jurusanData = jurusanSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch data pendaftaran
        const pendaftaranSnapshot = await getDocs(collection(db, 'pendaftaran_siswa'));
        const pendaftaranList = pendaftaranSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Proses rekap data
        processRekapData(pendaftaranList, jurusanData);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getFilteredData = () => {
    let filteredData = rekapData;

    // Filter berdasarkan tahun
    if (selectedTahun !== 'all') {
      filteredData = filteredData.filter(item => item.tahun === parseInt(selectedTahun));
    }

    // Filter berdasarkan jurusan
    if (selectedJurusan !== 'all') {
      filteredData = filteredData.filter(item => item.jurusan === selectedJurusan);
    }

    return filteredData;
  };

  const getTotalMahasiswa = () => {
    return getFilteredData().reduce((total, item) => total + item.totalMahasiswa, 0);
  };

  const getTotalJurusan = () => {
    const uniqueJurusan = new Set(getFilteredData().map(item => item.jurusan));
    return uniqueJurusan.size;
  };

  const getTotalTahun = () => {
    const uniqueTahun = new Set(getFilteredData().map(item => item.tahun));
    return uniqueTahun.size;
  };

  const getRekapPerTahun = () => {
    const rekapTahun = {};
    getFilteredData().forEach(item => {
      if (!rekapTahun[item.tahun]) {
        rekapTahun[item.tahun] = 0;
      }
      rekapTahun[item.tahun] += item.totalMahasiswa;
    });
    return rekapTahun;
  };

  const handleResetFilters = () => {
    setSelectedTahun('all');
    setSelectedJurusan('all');
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

  const rekapTahun = getRekapPerTahun();

  return (
    <>
      <HeaderPimpinan />
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Rekap Mahasiswa Baru per Jurusan
        </Typography>

        {/* Info Filter */}
        {(selectedTahun !== 'all' || selectedJurusan !== 'all') && (
          <Typography variant="h6" color="primary" gutterBottom>
            Filter: {selectedTahun !== 'all' ? `Tahun ${selectedTahun}` : 'Semua Tahun'}
            {selectedJurusan !== 'all' ? ` - ${selectedJurusan}` : ' - Semua Jurusan'}
          </Typography>
        )}

        {/* Filter */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Filter Jurusan</InputLabel>
                <Select
                  value={selectedJurusan}
                  label="Filter Jurusan"
                  onChange={(e) => setSelectedJurusan(e.target.value)}
                >
                  <MenuItem value="all">Semua Jurusan</MenuItem>
                  {jurusanList
                    .filter(jurusan => jurusan.nama) // Filter out items with undefined nama
                    .sort((a, b) => a.nama.localeCompare(b.nama))
                    .map(jurusan => (
                    <MenuItem key={jurusan.id} value={jurusan.nama}>
                      {jurusan.nama}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Reset Button */}
          {(selectedTahun !== 'all' || selectedJurusan !== 'all') && (
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
                  Total Tahun
                </Typography>
                <Typography variant="h4">
                  {getTotalTahun()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Jurusan
                </Typography>
                <Typography variant="h4">
                  {getTotalJurusan()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Mahasiswa Baru
                </Typography>
                <Typography variant="h4">
                  {getTotalMahasiswa()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Rata-rata per Jurusan
                </Typography>
                <Typography variant="h4">
                  {getTotalJurusan() > 0 ? Math.round(getTotalMahasiswa() / getTotalJurusan()) : 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Rekap per Tahun */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Rekap Mahasiswa Baru per Tahun
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Object.entries(rekapTahun)
                  .sort(([a], [b]) => parseInt(b) - parseInt(a))
                  .map(([tahun, total], index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Tahun {tahun}</Typography>
                      <Typography variant="body2">{total} mahasiswa baru</Typography>
                    </Box>
                    <Box sx={{
                      width: '100%',
                      height: 8,
                      backgroundColor: '#f0f0f0',
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}>
                      <Box sx={{
                        width: `${Math.max((total / Math.max(...Object.values(rekapTahun), 1)) * 100, 5)}%`,
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

          {/* Top Jurusan */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top 5 Jurusan
              </Typography>
              <Box sx={{ mt: 2 }}>
                {getFilteredData()
                  .reduce((acc, item) => {
                    const existing = acc.find(a => a.jurusan === item.jurusan);
                    if (existing) {
                      existing.total += item.totalMahasiswa;
                    } else {
                      acc.push({ jurusan: item.jurusan, total: item.totalMahasiswa });
                    }
                    return acc;
                  }, [])
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 5)
                  .map((item, index) => (
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
                      {item.jurusan}
                    </Typography>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                      {item.total}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Detail Table */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Detail Rekap per Jurusan dan Tahun
            {(selectedTahun !== 'all' || selectedJurusan !== 'all') && (
              <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 2 }}>
                (Filter: {selectedTahun !== 'all' ? `Tahun ${selectedTahun}` : 'Semua Tahun'}
                {selectedJurusan !== 'all' ? ` - ${selectedJurusan}` : ' - Semua Jurusan'})
              </Typography>
            )}
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Tahun</TableCell>
                  <TableCell>Jurusan</TableCell>
                  <TableCell align="center">Jumlah Mahasiswa Baru</TableCell>
                  <TableCell align="center">Persentase</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredData()
                  .sort((a, b) => {
                    if (a.tahun !== b.tahun) {
                      return b.tahun - a.tahun; // Sort by year desc
                    }
                    return b.totalMahasiswa - a.totalMahasiswa; // Then by total desc
                  })
                  .map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.tahun}</TableCell>
                    <TableCell>{item.jurusan}</TableCell>
                    <TableCell align="center">{item.totalMahasiswa}</TableCell>
                    <TableCell align="center">
                      {getTotalMahasiswa() > 0 ?
                        `${((item.totalMahasiswa / getTotalMahasiswa()) * 100).toFixed(1)}%` :
                        '0%'
                      }
                    </TableCell>
                  </TableRow>
                ))}
                {getFilteredData().length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Tidak ada data yang ditemukan
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </>
  );
};

export default RekapMahasiswaBaru;
