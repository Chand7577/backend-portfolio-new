const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  type: { type: String, enum: ['video', 'text'], default: 'text' },
  title: { type: String, required: true },
  company: { type: String, required: true },
  date: { type: String, required: true },
  content: { type: String },
  videoId: { type: String }, // For YouTube video testimonials
  role: { type: String }, // For text testimonials
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
