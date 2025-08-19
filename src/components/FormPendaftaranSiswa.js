import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Button, Drawer, IconButton, TextField, Typography, MenuItem,
  ToggleButtonGroup, ToggleButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../context/AuthContext';

const FormPendaftaranSiswa = ({ open, onClose, fetchData, editingData }) => {
  const { userData } = useContext(AuthContext);
  const [form, setForm] = useState({
    tglDaftar: '', namaPendaftar: '', nomorWA: '', email: '', asalSekolah: '',
    jurusan: '', biayaPendaftaran: '', jalurPendaftaran: '', noKwitansi: '', presenter: [],
    caraDaftar: '', ket: '', jenisPotongan: '', jumlahPotongan: '', totalBiayaPendaftaran: ''
  });
  const [jurusanList, setJurusanList] = useState([]);
  const [presenterList, setPresenterList] = useState([]);
  const [gelombangList, setGelombangList] = useState([]);
  const [jenisPotonganList, setJenisPotonganList] = useState([]);
  const [sumberList, setSumberList] = useState([]);
  const [metodeList, setMetodeList] = useState([]);
  const [jalurList, setJalurList] = useState([]);
  const [biayaList, setBiayaList] = useState([]);

  useEffect(() => {
    getDocs(collection(db, 'jurusan')).then(snapshot => {
      setJurusanList(snapshot.docs.map(doc => doc.data()));
    });
    getDocs(collection(db, 'presenter')).then(snapshot => {
      setPresenterList(snapshot.docs.map(doc => doc.data()));
    });
    getDocs(collection(db, 'gelombang')).then(snapshot => {
      setGelombangList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    getDocs(collection(db, 'potongan_biaya')).then(snapshot => {
      setJenisPotonganList(snapshot.docs.map(doc => doc.data()));
    });
    getDocs(collection(db, 'sumber_informasi')).then(snapshot => {
      setSumberList(snapshot.docs.map(doc => doc.data()));
    });
    getDocs(collection(db, 'metode_bayar')).then(snapshot => {
      setMetodeList(snapshot.docs.map(doc => doc.data()));
    });
    getDocs(collection(db, 'jalur_pendaftaran')).then(snapshot => {
      setJalurList(snapshot.docs.map(doc => doc.data()));
    });
    getDocs(collection(db, 'biaya_pendaftaran')).then(snapshot => {
      setBiayaList(snapshot.docs.map(doc => doc.data()));
    });
  }, []);

  useEffect(() => {
    if (editingData) {
      // Validasi permission untuk presenter saat edit
      if (userData?.role === 'presenter') {
        const isPresenterOwner = Array.isArray(editingData.presenter)
          ? editingData.presenter.includes(userData.namaLengkap)
          : editingData.presenter === userData.namaLengkap;

        if (!isPresenterOwner) {
          alert('Anda tidak memiliki permission untuk mengedit data ini.');
          onClose();
          return;
        }
      }

      setForm({
        ...editingData,
        presenter: editingData.presenter || [],
        jenisPotongan: editingData.jenisPotongan || '',
        jumlahPotongan: editingData.jumlahPotongan || '',
        totalBiayaPendaftaran: editingData.totalBiayaPendaftaran || editingData.biayaPendaftaran || '',
        jalurPendaftaran: editingData.jalurPendaftaran || '',
        sumberInformasi: editingData.sumberInformasi || ''
      });
    } else {
      // Set default presenter berdasarkan role
      let defaultPresenter = [];
      if (userData?.role === 'presenter' && userData?.namaLengkap) {
        defaultPresenter = [userData.namaLengkap];
      }

      setForm({
        tglDaftar: '', namaPendaftar: '', nomorWA: '', email: '', asalSekolah: '',
        jurusan: '', biayaPendaftaran: '', jalurPendaftaran: '', noKwitansi: '',
        presenter: defaultPresenter,
        caraDaftar: '', ket: '', jenisPotongan: '', jumlahPotongan: '',
        totalBiayaPendaftaran: '', sumberInformasi: ''
      });
    }
  }, [editingData, userData, onClose]);

  const generateNomorPendaftaran = async (tgl) => {
    const dateStr = tgl.replace(/-/g, '');
    const qGel = gelombangList.find(g => g.tanggalMulai <= tgl && g.tanggalAkhir >= tgl);
    if (!qGel) {
      alert('Tanggal daftar tidak masuk dalam rentang gelombang manapun!');
      return { nomorPendaftaran: '', idGelombang: '' };
    }

    const snapshot = await getDocs(query(collection(db, 'pendaftaran_siswa'), where('idGelombang', '==', qGel.id)));
    const urutan = snapshot.size + 1;
    const nomor = `${dateStr}-${urutan.toString().padStart(3, '0')}`;
    return { nomorPendaftaran: nomor, idGelombang: qGel.id };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tglDaftar || !form.namaPendaftar || !form.jurusan) return;

    if (editingData?.id) {
      await updateDoc(doc(db, 'pendaftaran_siswa', editingData.id), {
        ...form,
        sumberInformasi: form.sumberInformasi,
        cabangOffice: userData?.cabangOffice || ''
      });
    } else {
      const { nomorPendaftaran, idGelombang } = await generateNomorPendaftaran(form.tglDaftar);
      await addDoc(collection(db, 'pendaftaran_siswa'), {
        nomorPendaftaran,
        tglDaftar: form.tglDaftar,
        idGelombang,
        namaPendaftar: form.namaPendaftar,
        nomorWA: form.nomorWA,
        email: form.email,
        asalSekolah: form.asalSekolah,
        jurusan: form.jurusan,
        biayaPendaftaran: form.biayaPendaftaran,
        noKwitansi: form.noKwitansi,
        presenter: form.presenter,
        caraDaftar: form.caraDaftar,
        ket: form.ket,
        cabangOffice: userData?.cabangOffice || '',
        jenisPotongan: form.jenisPotongan,
        jumlahPotongan: form.jumlahPotongan,
        totalBiayaPendaftaran: form.totalBiayaPendaftaran,
        sumberInformasi: form.sumberInformasi
      });
    }
    fetchData();
    onClose();

    // Reset form dengan default presenter sesuai role
    let defaultPresenter = [];
    if (userData?.role === 'presenter' && userData?.namaLengkap) {
      defaultPresenter = [userData.namaLengkap];
    }

    setForm({
      tglDaftar: '', namaPendaftar: '', nomorWA: '', email: '', asalSekolah: '',
      jurusan: '', biayaPendaftaran: '', jalurPendaftaran: '', noKwitansi: '',
      presenter: defaultPresenter,
      caraDaftar: '', ket: '', jenisPotongan: '', jumlahPotongan: '',
      totalBiayaPendaftaran: '', sumberInformasi: ''
    });
  };

  // Helper fungsi untuk mengubah format mata uang
  const parseCurrency = (value) => {
    if (!value) return 0;
    return parseInt(value.toString().replace(/\./g, ''));
  };

  // Helper fungsi untuk format nilai mata uang
  const formatCurrency = (value) => {
    if (!value) return '0';
    return parseInt(value).toLocaleString('id-ID');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'biayaPendaftaran') {
      const biayaPendaftaran = parseCurrency(value);
      const jumlahPotongan = parseCurrency(form.jumlahPotongan);
      const potonganValid = Math.min(jumlahPotongan, biayaPendaftaran);
      const total = Math.max(biayaPendaftaran - potonganValid, 0);

      setForm(prev => ({
        ...prev,
        [name]: value,
        jumlahPotongan: biayaPendaftaran === 0 ? '' : potonganValid.toString(),
        jenisPotongan: biayaPendaftaran === 0 ? '' : prev.jenisPotongan,
        totalBiayaPendaftaran: formatCurrency(total)
      }));
    } else if (name === 'jenisPotongan') {
      const selected = jenisPotonganList.find(d => d.jenisPotongan === value);
      const jumlahPotongan = selected ? parseCurrency(selected.jumlahPotongan) : 0;
      const biayaPendaftaran = parseCurrency(form.biayaPendaftaran);
      const potonganValid = Math.min(jumlahPotongan, biayaPendaftaran);
      const total = Math.max(biayaPendaftaran - potonganValid, 0);

      setForm(prev => ({
        ...prev,
        jenisPotongan: value,
        jumlahPotongan: selected ? potonganValid.toString() : '',
        totalBiayaPendaftaran: formatCurrency(total)
      }));
    } else if (name === 'jumlahPotongan') {
      const biayaPendaftaran = parseCurrency(form.biayaPendaftaran);
      const jumlahPotongan = parseCurrency(value);
      const potonganValid = Math.min(jumlahPotongan, biayaPendaftaran);
      const total = Math.max(biayaPendaftaran - potonganValid, 0);

      setForm(prev => ({
        ...prev,
        jumlahPotongan: value,
        totalBiayaPendaftaran: formatCurrency(total)
      }));
    } else if (name === 'jurusan') {
      setForm(prev => ({
        ...prev,
        jurusan: value
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // const handleChange = (e) => {
  //   setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  // };

  return (
    <Drawer anchor="left" open={open} onClose={onClose} PaperProps={{ sx: { width: '75vw' } }}>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{editingData ? 'Edit Pendaftaran Siswa' : 'Tambah Pendaftaran Siswa'}</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Kolom kiri */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField type="date" label="Tanggal Daftar" name="tglDaftar" value={form.tglDaftar} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} required />
              <TextField label="Nama Pendaftar" name="namaPendaftar" value={form.namaPendaftar} onChange={handleChange} fullWidth />
              <TextField label="Nomor WA" name="nomorWA" value={form.nomorWA} onChange={handleChange} fullWidth />
              <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth />
              <TextField label="Asal Sekolah" name="asalSekolah" value={form.asalSekolah} onChange={handleChange} fullWidth />
              <TextField select label="Jurusan" name="jurusan" value={form.jurusan} onChange={handleChange} fullWidth>
                {jurusanList.map((j, i) => (
                  <MenuItem key={i} value={j.nama}>{j.nama}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Biaya Pendaftaran"
                name="biayaPendaftaran"
                value={form.biayaPendaftaran}
                onChange={handleChange}
                fullWidth
                required
              >
                <MenuItem value="">Pilih Biaya Pendaftaran</MenuItem>
                {biayaList.map((b, i) => (
                  <MenuItem key={i} value={b.jumlahBiayaPendaftaran}>
                    {b.jenisBiayaPendaftaran} - Rp {b.jumlahBiayaPendaftaran}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Jenis Potongan"
                name="jenisPotongan"
                value={form.jenisPotongan || ''}
                onChange={handleChange}
                fullWidth
                disabled={parseCurrency(form.biayaPendaftaran) === 0}
              >
                <MenuItem value="">Tanpa Potongan Biaya</MenuItem>
                {jenisPotonganList.map((d, i) => (
                  <MenuItem key={i} value={d.jenisPotongan}>{d.jenisPotongan}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Jumlah Potongan"
                name="jumlahPotongan"
                value={form.jumlahPotongan ? form.jumlahPotongan.toString() : ''}
                fullWidth
                disabled={parseCurrency(form.biayaPendaftaran) === 0}
              />
              <TextField
                label="Total Biaya Pendaftaran"
                name="totalBiayaPendaftaran"
                value={form.totalBiayaPendaftaran ? form.totalBiayaPendaftaran.toString() : ''}
                fullWidth
                disabled
              />
            </Box>

            {/* Kolom kanan */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="No Kwitansi" name="noKwitansi" value={form.noKwitansi} onChange={handleChange} fullWidth />

              <Box>
                <Typography sx={{ mb: 1 }}>Pilih Presenter</Typography>
                <ToggleButtonGroup
                  value={form.presenter}
                  onChange={(e, newVal) => {
                    // Jika role presenter, hanya bisa memilih dirinya sendiri
                    if (userData?.role === 'presenter') {
                      if (newVal.includes(userData.namaLengkap)) {
                        setForm(prev => ({ ...prev, presenter: [userData.namaLengkap] }));
                      } else {
                        // Jika mencoba unselect dirinya sendiri, tetap pilih dirinya
                        setForm(prev => ({ ...prev, presenter: [userData.namaLengkap] }));
                      }
                    } else {
                      // Pimpinan bisa memilih siapa saja
                      setForm(prev => ({ ...prev, presenter: newVal }));
                    }
                  }}
                  multiple
                  color="primary"
                  size="small"
                  sx={{ flexWrap: 'wrap', gap: 1 }}
                >
                  {presenterList
                    .filter(p => {
                      // Jika role presenter, hanya tampilkan dirinya sendiri
                      if (userData?.role === 'presenter') {
                        return p.namaLengkap === userData.namaLengkap;
                      }
                      // Jika role pimpinan, tampilkan semua presenter
                      return true;
                    })
                    .map((p, i) => (
                      <ToggleButton
                        key={i}
                        value={p.namaLengkap}
                        selected={form.presenter.includes(p.namaLengkap)}
                        sx={{
                          textTransform: 'none',
                          borderRadius: '8px',
                          borderColor: '#1976d2',
                          '&.Mui-selected': {
                            backgroundColor: '#1976d2',
                            color: '#fff',
                          },
                          '&:hover': {
                            backgroundColor: '#1565c0',
                            color: '#fff'
                          }
                        }}
                      >
                        {p.namaLengkap}
                        {userData?.role === 'presenter' && p.namaLengkap === userData.namaLengkap &&
                          <Typography variant="caption" sx={{ ml: 1, opacity: 0.7 }}>(Anda)</Typography>
                        }
                      </ToggleButton>
                    ))}
                </ToggleButtonGroup>
                {userData?.role === 'presenter' && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Sebagai presenter, Anda hanya dapat memilih diri sendiri sebagai presenter.
                  </Typography>
                )}
              </Box>

              <TextField select label="Cara Daftar" name="caraDaftar" value={form.caraDaftar} onChange={handleChange} fullWidth>
                {/* <MenuItem value="CASH">CASH</MenuItem>
                <MenuItem value="TF">TF</MenuItem>
                <MenuItem value="CICIL">CICIL</MenuItem> */}
                <MenuItem value="">Pilih Metode Pembayaran</MenuItem>
                {metodeList.map((s, i) => (
                  <MenuItem key={i} value={s.idcode}>{s.idcode}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Sumber Informasi"
                name="sumberInformasi"
                value={form.sumberInformasi}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="">Pilih Sumber Informasi</MenuItem>
                {sumberList.map((s, i) => (
                  <MenuItem key={i} value={s.sumber}>{s.sumber}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Jalur Pendaftaran"
                name="jalurPendaftaran"
                value={form.jalurPendaftaran}
                onChange={handleChange}
                fullWidth
                required
              >
                <MenuItem value="">Pilih Jalur Pendaftaran</MenuItem>
                {jalurList.map((j, i) => (
                  <MenuItem key={i} value={j.jalurPendaftaran}>{j.jalurPendaftaran}</MenuItem>
                ))}
              </TextField>
              <TextField label="Keterangan" name="ket" value={form.ket} onChange={handleChange} fullWidth multiline minRows={3} />
            </Box>
          </Box>

          <Button type="submit" variant="contained" fullWidth sx={{ mt: 3 }}>
            {editingData ? 'Simpan Perubahan' : 'Simpan'}
          </Button>
        </form>

      </Box>
    </Drawer>
  );
};

export default FormPendaftaranSiswa;
