const  mongoose  = require('mongoose');
const carouselItemSchema = new mongoose.Schema({
  imageSrc: {
    type: String, // URL or path to the image
    required: true,
    trim: true
  },
  altText: {
    type: String, // Alt text for accessibility
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  buttonLink: {
    type: String, // The URL the button navigates to
    required: true,
    trim: true
  },
  buttonText: {
    type: String, // Text displayed on the button
    required: true,
    trim: true
  },
  order: {
    type: Number, // For sorting carousel items
    default: 0
  },
  isActive: {
    type: Boolean, // To enable/disable item display
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CarouselItem', carouselItemSchema);