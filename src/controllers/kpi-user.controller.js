
const {ExportOrder ,SalesKPI,User, sequelize} = require("~/models");

// Helper functions để tính KPI
const calculateMonthlyKPI = async (userId, month, year) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
  
    // Lấy tất cả đơn hàng trong tháng của nhân viên
    const monthlyOrders = await ExportOrder.findAll({
      where: {
        userId: userId,
        dateExport: {
          [Op.between]: [startDate, endDate]
        },
        status: true // Chỉ tính các đơn hàng đã hoàn thành
      }
    });
  
    // Tính toán các chỉ số
    const actualRevenue = monthlyOrders.reduce((sum, order) => 
      sum + parseFloat(order.total_price), 0);
    const actualOrders = monthlyOrders.length;
  
    // Giả sử mục tiêu được set từ trước (có thể customize theo từng nhân viên)
    const targetRevenue = 1000000000; // 1 tỷ VND/tháng
    const targetOrders = 50; // 50 đơn/tháng
  
    // Tính % KPI (trọng số: doanh số 70%, số đơn 30%)
    const revenueWeight = 0.7;
    const ordersWeight = 0.3;
  
    const revenuePercentage = (actualRevenue / targetRevenue) * 100 * revenueWeight;
    const ordersPercentage = (actualOrders / targetOrders) * 100 * ordersWeight;
    const kpiPercentage = revenuePercentage + ordersPercentage;
  
    // Xác định trạng thái
    let status = 'pending';
    if (kpiPercentage >= 100) status = 'achieved';
    else if (month < new Date().getMonth() + 1) status = 'failed';
  
    // Lưu hoặc cập nhật KPI
    const [kpi, created] = await SalesKPI.findOrCreate({
      where: { userId, month, year },
      defaults: {
        targetRevenue,
        actualRevenue,
        targetOrders,
        actualOrders,
        kpiPercentage,
        status
      }
    });
  
    if (!created) {
      await kpi.update({
        actualRevenue,
        actualOrders,
        kpiPercentage,
        status
      });
    }
  
    return kpi;
  };
  
  // Function tạo báo cáo KPI
  const generateKPIReport = async (userId, startMonth, startYear, endMonth, endYear) => {
    const kpiData = await SalesKPI.findAll({
      where: {
        userId,
        [Op.and]: [
          sequelize.where(sequelize.fn('YEAR', sequelize.col('createdAt')), '>=', startYear),
          sequelize.where(sequelize.fn('YEAR', sequelize.col('createdAt')), '<=', endYear),
          sequelize.where(sequelize.fn('MONTH', sequelize.col('createdAt')), '>=', startMonth),
          sequelize.where(sequelize.fn('MONTH', sequelize.col('createdAt')), '<=', endMonth),
        ]
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['fullName', 'email']
      }],
      order: [['year', 'ASC'], ['month', 'ASC']]
    });
  
    return kpiData;
  };

  module.exports ={
    calculateMonthlyKPI,
    generateKPIReport
  }