const express = require('express');
const router = express.Router();
const { submitContact, getContactMessages, deleteContactMessage } = require('../controllers/contactController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', submitContact);
router.get('/', protect, adminOnly, getContactMessages);
router.delete('/:id', protect, adminOnly, deleteContactMessage);

module.exports = router;
