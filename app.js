//app.js

// Importing the express module
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const db = require('./config/db');

// Creating an express application
const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// middleware session
app.use(
  session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware untuk cek login
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
}

// Route: Halaman Login
app.get('/login', (req, res) => {
  const errorMessages = req.session.errorMessages || [];
  delete req.session.errorMessages;
  res.render('pages/login/index', { errorMessages });
});

//Proses Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) throw err;
    if (results.length === 0) return res.redirect('/login');

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      req.session.user = user;
      return res.redirect('/');
    } else {
      // send alert
      req.session.errorMessages = ['Username atau password salah'];
      res.redirect('/login');
    }
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Halaman Utama
app.get('/', isAuthenticated, (req, res) => {
  res.render('pages/dashboard/index', { user: req.session.user });
});

app.get('/data-ruangan', isAuthenticated, (req, res) => {
  const errorMessages = req.session.errorMessages || [];
  const successMessages = req.session.successMessages || [];

  delete req.session.errorMessages;
  delete req.session.successMessages;

  db.query('SELECT * FROM m_rooms', (err, results) => {
    if (err) throw err;
    res.render('pages/rooms/index', { rooms: results, errorMessages, successMessages });
  });
});

app.post('/data-ruangan', isAuthenticated, (req, res) => {
  const { r_name, r_type, r_capacity, r_price, r_description } = req.body;
  db.query('INSERT INTO m_rooms (r_name, r_type, r_capacity, r_price, r_description) VALUES (?, ?, ?, ?, ?)', [r_name, r_type, r_capacity, r_price, r_description], (err, result) => {
    if (err) {
      req.session.errorMessages = ['Gagal menambahkan data ruangan.'];
    } else {
      req.session.successMessages = ['Berhasil menambahkan data ruangan.'];
    }
    res.redirect('/data-ruangan');
  });
});

app.post('/data-ruangan/delete/:room_id', isAuthenticated, (req, res) => {
  const { room_id } = req.params;

  db.query('DELETE FROM m_rooms WHERE room_id = ?', [room_id], (err, result) => {
    if (err) {
      req.session.errorMessages = ['Gagal menghapus data ruangan.'];
    } else {
      req.session.successMessages = ['Berhasil menghapus data ruangan.'];
    }
    res.redirect('/data-ruangan');
  });
});

app.get('/data-ruangan/edit/:room_id', isAuthenticated, (req, res) => {
  const { room_id } = req.params;

  db.query('SELECT * FROM m_rooms WHERE room_id = ?', [room_id], (err, results) => {
    if (err) {
      req.session.errorMessages = ['Gagal mengambil data ruangan.'];
      return res.redirect('/data-ruangan');
    }

    if (results.length === 0) {
      req.session.errorMessages = ['Data ruangan tidak ditemukan.'];
      return res.redirect('/data-ruangan');
    }

    const room = results[0];
    res.render('pages/rooms/edit', { room }); // Render halaman detail atau edit dengan data room
  });
});


// Update data ruangan berdasarkan room_id
app.post('/data-ruangan/update/:room_id', isAuthenticated, (req, res) => {
  const { room_id } = req.params;
  const { r_name, r_type, r_capacity, r_price, r_description } = req.body;

  db.query(
    'UPDATE m_rooms SET r_name = ?, r_type = ?, r_capacity = ?, r_price = ?, r_description = ? WHERE id = ?',
    [r_name, r_type, r_capacity, r_price, r_description, room_id],
    (err, result) => {
      if (err) {
        req.session.errorMessages = ['Gagal memperbarui data ruangan.'];
      } else {
        req.session.successMessages = ['Data ruangan berhasil diperbarui.'];
      }
      res.redirect('/data-ruangan');
    }
  );
});



// Update Peminjaman
app.post('/bookings/edit/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  const { room_name, booked_by, date, start_time, end_time } = req.body;
  db.query('UPDATE bookings SET room_name = ?, booked_by = ?, date = ?, start_time = ?, end_time = ? WHERE id = ?', [room_name, booked_by, date, start_time, end_time, id], (err, result) => {
    if (err) throw err;
    res.redirect('/bookings');
  });
});

// Hapus Peminjaman
app.post('/bookings/delete/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM bookings WHERE id = ?', [id], (err, result) => {
    if (err) throw err;
    res.redirect('/bookings');
  });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
