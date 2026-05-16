const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  date: { type: String, default: () => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
  image: { type: String, required: true },
  imagePublicId: { type: String },
  content: { type: String, required: true },
  tags: [String],
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);
