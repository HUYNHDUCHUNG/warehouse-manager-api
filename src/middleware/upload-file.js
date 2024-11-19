const multer = require('multer');
const path = require('path');
// Sử dụng memory storage thay vì disk storage
const storage = multer.memoryStorage();

// Cấu hình filter cho file Excel
const fileFilter = (req, file, cb) => {
    // Chấp nhận các file Excel
    const allowedMimes = [
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'text/csv' // .csv
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only Excel files are allowed.'), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
    }
});
