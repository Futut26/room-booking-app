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
  res.render('login', { errorMessages });

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
  res.render('index', { user: req.session.user });
});

// CRUD Routes untuk Peminjaman Ruangan
// List Peminjaman
app.get('/bookings', isAuthenticated, (req, res) => {
  db.query('SELECT * FROM bookings', (err, results) => {
    if (err) throw err;
    res.render('bookings', { bookings: results });
  });
});

// Tambah Peminjaman
app.post('/bookings', isAuthenticated, (req, res) => {
  const { room_name, booked_by, date, start_time, end_time } = req.body;
  db.query('INSERT INTO bookings (room_name, booked_by, date, start_time, end_time) VALUES (?, ?, ?, ?, ?)', [room_name, booked_by, date, start_time, end_time], (err, result) => {
    if (err) throw err;
    res.redirect('/bookings');
  });
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
