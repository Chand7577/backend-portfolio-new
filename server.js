const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');


dotenv.config();



const app = express();
// add with your other requires at the top
const googleReviewsRoute = require('./routes/googleReviewsRoute');

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  // Netlify deployment — update this if your Netlify URL changes
  'https://proto-portfolio12.netlify.app',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
// const testimonialRoutes = require('./routes/testimonialRoutes');
const projectRoutes = require('./routes/projectRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
// app.use('/api/testimonials', testimonialRoutes);
app.use('/api/projects', projectRoutes);

app.get('/api/debug/cloudinary', (req, res) => {
  res.json({
    hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
    hasApiKey: !!process.env.CLOUDINARY_API_KEY,
    hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ? (process.env.CLOUDINARY_CLOUD_NAME.substring(0, 3) + '...') : 'missing'
  });
});







// add with your other routes
app.use('/api/google-reviews', googleReviewsRoute);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
