const express = require('express');
const cors = require('cors');
const { loadEnv } = require('./config/env');
const authRoutes = require('./routes/authRoute');
const userRoutes = require('./routes/usersRoute');
const garageRoutes = require('./routes/garagesRoute');
const bookingRoutes = require('./routes/bookingsRoute');
const notificationRoutes = require('./routes/notificationsRoute');
const transactionRoutes = require('./routes/transactionsRoute');
const ratingRoutes = require('./routes/ratingsRoute');

const contactRoutes = require('./routes/contact');
const { errorHandler } = require('./utils/errorHandler');

loadEnv();

const app = express();

// Middlewares
app.use(cors('*'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.status(200).send('Welcome to my Node.js API on Vercel!');
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/garages', garageRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/ratings', ratingRoutes);

app.use('/api/contact', contactRoutes);

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});