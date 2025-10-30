const Contact = require('../models/contactus');

exports.submitContactForm = async (req, res) => {
    try {
        const { firstName, lastName, phone, email, message, consent } = req.body;
        
        // Validate required fields
        if (!firstName || !lastName || !phone || !email || !message || consent === undefined) {
            return res.status(400).json({ 
                success: false,
                message: 'All fields are required and consent must be given'
            });
        }

        // Create new contact submission
        const newContact = new Contact({
            firstName,
            lastName,
            phone,
            email,
            message,
            consent
        });

        // Save to database
        await newContact.save();
        
        res.status(201).json({
            success: true,
            message: 'Thank you for contacting us! We will get back to you soon.'
        });
    } catch (error) {
        console.error('Error saving contact form:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};