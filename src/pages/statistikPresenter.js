import React, { useEffect, useState } from 'react';
import HeaderPimpinan from '../components/HeaderPimpinan';
import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, MenuItem, TextField } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const StatistikPresenter = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() 0-based

  const [data, setData] = useState([]);
  const [presenterList, setPresenterList] = useState([]);
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  useEffect(() => {
    fetchData();
    fetchPresenter();
  }, []);

  const fetchData = async () => {
    const snapshot = await getDocs(collection(db, 'pendaftaran_siswa'));
    setData(snapshot.docs.map(doc => doc.data()));
  };

  const fetchPresenter = async () => {
    const snapshot = await getDocs(collection(db, 'presenter'));
    setPresenterList(snapshot.docs.map(doc => doc.data()));
  };

  // Filter data sesuai bulan dan tahun
  const filteredData = data.filter(item => {
    if (!item.tglDaftar) return false;
    const [itemYear, itemMonth] = item.tglDaftar.split('-');
    return (
      (!month || parseInt(itemMonth) === parseInt(month)) &&
      (!year || parseInt(itemYear) === parseInt(year))
    );
  });

  // Hitung perolehan per presenter
  const perolehan = {};
  presenterList.forEach(p => {
    perolehan[p.namaLengkap] = 0;
  });
  filteredData.forEach(item => {
    if (Array.isArray(item.presenter)) {
      item.presenter.forEach(p => {
        if (perolehan[p] !== undefined) perolehan[p]++;
      });
    } else if (item.presenter && perolehan[item.presenter] !== undefined) {
      perolehan[item.presenter]++;
    }
  });

  return (
    <Box>
      <HeaderPimpinan />
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Statistik Perolehan Presenter</Typography>
        <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            select
            label="Bulan"
            value={month}
            onChange={e => setMonth(e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">Semua Bulan</MenuItem>
            {monthNames.map((name, idx) => (
              <MenuItem key={idx + 1} value={idx + 1}>{name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Tahun"
            value={year}
            onChange={e => setYear(e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ minWidth: 100 }}
          >
            <MenuItem value="">Semua Tahun</MenuItem>
            {Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i).map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </TextField>
        </Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>No</TableCell>
              <TableCell>Nama Presenter</TableCell>
              <TableCell>Jumlah Perolehan</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {presenterList.map((p, idx) => (
              <TableRow key={p.namaLengkap}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{p.namaLengkap}</TableCell>
                <TableCell>{perolehan[p.namaLengkap]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
};

export default StatistikPresenter;
