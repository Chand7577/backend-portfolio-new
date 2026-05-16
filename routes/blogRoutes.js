const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const auth = require('../middleware/auth');
const { upload, cloudinary } = require('../middleware/cloudinary');

// Get all blogs (Public)
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single blog (Public)
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create blog (Protected) with Image Upload
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const blogData = { ...req.body };
    
    // Parse tags if sent as string
    if (typeof blogData.tags === "string") {
      blogData.tags = blogData.tags.split(",").map(t => t.trim()).filter(Boolean);
    }
    
    if (req.file) {
      blogData.image = req.file.path;
      blogData.imagePublicId = req.file.filename;
    }
    
    const newBlog = new Blog(blogData);
    const blog = await newBlog.save();
    res.json(blog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update blog (Protected) with Image Upload
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const blogData = { ...req.body };
    
    // Parse tags if sent as string
    if (typeof blogData.tags === "string") {
      blogData.tags = blogData.tags.split(",").map(t => t.trim()).filter(Boolean);
    }

    const blogToUpdate = await Blog.findById(req.params.id);
    if (!blogToUpdate) return res.status(404).json({ message: 'Blog not found' });

    if (req.file) {
      // If there's a new file and an old image exists in Cloudinary, delete the old one
      if (blogToUpdate.imagePublicId) {
        await cloudinary.uploader.destroy(blogToUpdate.imagePublicId);
      }
      blogData.image = req.file.path;
      blogData.imagePublicId = req.file.filename;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, blogData, { new: true });
    res.json(updatedBlog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete blog (Protected)
router.delete('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    
    // Delete image from cloudinary if it exists
    if (blog.imagePublicId) {
      await cloudinary.uploader.destroy(blog.imagePublicId);
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
