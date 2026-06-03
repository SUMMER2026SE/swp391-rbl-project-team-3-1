const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Lấy token từ header Authorization (Định dạng chuẩn: Bearer <token>)
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: 'Không tìm thấy mã xác thực Authorization!' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Định dạng Authorization không hợp lệ (Phải là Bearer token)!' });
    }

    try {
        // Giải mã và kiểm định tính hợp lệ của token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'BiMatSieuCap_SWP391');
        
        // Gắn thông tin người dùng giải mã được vào request
        req.user = decoded; // chứa userId và roleId
        next();
    } catch (error) {
        console.error('❌ Lỗi xác thực JWT:', error.message);
        return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ!' });
    }
};
