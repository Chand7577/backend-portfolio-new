const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url:       { type: String, required: true }, // Cloudinary secure URL
  publicId:  { type: String, required: true }, // Cloudinary public_id (needed for deletion)
  caption:   { type: String, default: '' },
});

const projectSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category:    { type: String, required: true, trim: true },
    tags:        { type: [String], default: [] },
    liveUrl:     { type: String, default: '' },
    githubUrl:   { type: String, default: '' },
    featured:    { type: Boolean, default: false },
    images:      { type: [imageSchema], default: [] }, // Multiple Cloudinary images
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
