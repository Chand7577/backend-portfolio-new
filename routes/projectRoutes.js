const express = require('express');
const router  = express.Router();
// Version 1.1 - Fixed Express 5 Routing
const Project = require('../models/Project');
const auth    = require('../middleware/auth');
const { cloudinary, upload } = require('../middleware/cloudinary');

/* ─────────────────────────────────────────────────────────────
   GET /api/projects          — Public: list all projects
   GET /api/projects/featured — Public: featured projects only
   GET /api/projects/:id      — Public: single project
───────────────────────────────────────────────────────────── */

router.get('/', async (req, res) => {
  try {
    const { category, tag } = req.query;
    const filter = {};
    if (category) filter.category = { $regex: category, $options: 'i' };
    if (tag)      filter.tags = tag;

    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Removed /featured endpoint per user request

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/projects
   Protected. Accepts multipart/form-data.
   Fields: title, description, category, tags (comma str),
           liveUrl, githubUrl, featured, images[] (files)
───────────────────────────────────────────────────────────── */

router.post('/', auth, (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      console.error('Multer/Cloudinary Upload Error:', err);
      return res.status(400).json({ message: 'Image upload failed', error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('Incoming Project Data:', req.body);
    console.log('Uploaded Files:', req.files);

    const { title, description, category, tags, liveUrl } = req.body;

    // Build image array from Cloudinary upload results
    const images = (req.files || []).map((file, i) => ({
      url:      file.path,         // Cloudinary secure URL
      publicId: file.filename,     // Cloudinary public_id
      caption:  req.body[`captions[${i}]`] || '',
    }));

    const project = new Project({
      title,
      description,
      category,
      tags:      tags ? String(tags).split(',').map(t => t.trim()).filter(Boolean) : [],
      liveUrl:   liveUrl   || '',
      images,
    });

    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error('Project Save Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   PUT /api/projects/:id
   Protected. Updates text fields + optionally adds new images.
   Send removeImages[] = array of publicIds to delete from Cloudinary.
───────────────────────────────────────────────────────────── */

router.put('/:id', auth, (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      console.error('Multer/Cloudinary Upload Error:', err);
      return res.status(400).json({ message: 'Image upload failed', error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const { title, description, category, tags, liveUrl, removeImages } = req.body;

    // ── Delete specified images from Cloudinary ──
    const toRemove = Array.isArray(removeImages)
      ? removeImages
      : removeImages ? [removeImages] : [];

    if (toRemove.length > 0) {
      await Promise.all(
        toRemove.map(publicId => cloudinary.uploader.destroy(publicId))
      );
      // Remove from project images array
      project.images = project.images.filter(img => !toRemove.includes(img.publicId));
    }

    // ── Append newly uploaded images ──
    const newImages = (req.files || []).map((file, i) => ({
      url:      file.path,
      publicId: file.filename,
      caption:  req.body[`captions[${i}]`] || '',
    }));
    project.images.push(...newImages);

    // ── Update scalar fields ──
    if (title       !== undefined) project.title       = title;
    if (description !== undefined) project.description = description;
    if (category    !== undefined) project.category    = category;
    if (tags        !== undefined) project.tags        = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (liveUrl     !== undefined) project.liveUrl     = liveUrl;
// githubUrl and featured fields removed

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   DELETE /api/projects/:id
   Protected. Removes project + all its Cloudinary images.
───────────────────────────────────────────────────────────── */

router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Delete all images from Cloudinary
    if (project.images.length > 0) {
      await Promise.all(
        project.images.map(img => cloudinary.uploader.destroy(img.publicId))
      );
    }

    await project.deleteOne();
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   DELETE /api/projects/:id/images/:publicId
   Protected. Remove a single image from a project.
───────────────────────────────────────────────────────────── */

router.delete('/:id/images', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const { publicId } = req.query;
    if (!publicId) return res.status(400).json({ message: 'publicId query param is required' });
    const exists = project.images.some(img => img.publicId === publicId);
    if (!exists) return res.status(404).json({ message: 'Image not found in project' });

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Remove from project
    project.images = project.images.filter(img => img.publicId !== publicId);
    await project.save();

    res.json({ message: 'Image deleted', project });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
