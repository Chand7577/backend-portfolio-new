// Updated Project model - removed githubUrl and featured fields
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url:       { type: String, required: true }, // Cloudinary secure URL
  publicId:  { type: String, required: true }, // Cloudinary public_id (needed for deletion)

});

const projectSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category:    { type: String, required: true, trim: true },
    tags:        { type: [String], default: [] },
  
    // githubUrl field removed per request
    // featured field removed per request
    images:      { type: [imageSchema], default: [] }, // Multiple Cloudinary images
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
