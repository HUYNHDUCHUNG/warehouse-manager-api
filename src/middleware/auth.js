const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // Lấy token từ header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                message: 'Authorization header không tồn tại'
            });
        }

        // Kiểm tra format Bearer token
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Invalid token format. Use: Bearer <token>'
            });
        }

        // Tách lấy token (bỏ từ "Bearer " ở đầu)
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                message: 'Token không được cung cấp'
            });
        }

        // Xác thực token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Thêm thông tin user vào request object
        req.user = decoded;
        
        // Chuyển sang middleware tiếp theo
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                message: 'Token đã hết hạn'
            });
        }
        
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                message: 'Token không hợp lệ'
            }); 
        }

        return res.status(500).json({
            message: 'Lỗi server khi xác thực token',
            error: error.message
        });
    }
};

module.exports = authMiddleware;