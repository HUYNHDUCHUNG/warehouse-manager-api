export const generateMaPhieu = (startChar) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
    // Tạo một số ngẫu nhiên để tăng tính duy nhất
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
    return `${startChar}${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}${randomNum}`;
  };
  export function generateProductCode(startChar) {
    // Lấy thời gian hiện tại
    const now = new Date();
    
    // Lấy giờ, phút, giây
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // Tạo phần random 4 ký tự
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
        randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Kết hợp các phần
    return `${startChar}${hours}${minutes}${seconds}`;
}
  