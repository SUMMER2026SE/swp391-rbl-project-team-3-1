const multer = require('multer');
const path = require('path');
const fs = require('fs');

const avatarDir = path.join(__dirname, '../../public/uploads/avatars');

if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, avatarDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const fileName = `avatar-${req.user.userId}-${Date.now()}${ext}`;
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

const uploadAvatar = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    }
});

module.exports = uploadAvatar;
