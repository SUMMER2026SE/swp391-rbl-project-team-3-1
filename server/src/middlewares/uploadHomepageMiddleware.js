const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload to client/public/assets/images
const imagesDir = path.join(__dirname, '../../../client/public/assets/images');

if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const fileName = `homepage-${Date.now()}${ext}`;
        cb(null, fileName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error('Chỉ cho phép upload ảnh JPG, JPEG, PNG hoặc WEBP!'), false);
    }

    cb(null, true);
};

const uploadHomepageImages = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = uploadHomepageImages;
