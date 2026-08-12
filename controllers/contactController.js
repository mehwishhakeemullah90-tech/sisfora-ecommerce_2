const ContactMessage = require('../models/ContactMessage');
const asyncHandler = require('../middleware/asyncHandler');

// POST /api/contact  — public
exports.submitContact = asyncHandler(async (req, res) => {
  const { fullName, email, subject, message } = req.body;

  if (!fullName || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  await ContactMessage.create({ fullName, email, subject, message });

  res.status(201).json({ success: true, message: "Thank you! We've received your message and will respond within 24 hours." });
});

// GET /api/contact  — admin only
exports.getContactMessages = asyncHandler(async (req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 });
  res.json({ success: true, data: messages });
});

// DELETE /api/contact/:id  — admin only
exports.deleteContactMessage = asyncHandler(async (req, res) => {
  const msg = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });
  res.json({ success: true, message: 'Message deleted.' });
});
