
const {ExportOrder ,SalesKPI,User, sequelize} = require("~/models");
const { Op } = require('sequelize');

const calculateMonthlyKPI = async () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Lấy tất cả nhân viên sale đang hoạt động
  const users = await User.findAll({
    where: { 
      role: 'SALE', 
      status: true 
    }
  });

  // Khởi tạo mảng promises để xử lý song song
  const kpiPromises = users.map(async (user) => {
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);

    // Lấy tất cả đơn hàng trong tháng của nhân viên
    const monthlyOrders = await ExportOrder.findAll({
      where: {
        userId: user.id,
        dateExport: {
          [Op.between]: [startDate, endDate]
        },
        status: true // Chỉ tính các đơn hàng đã hoàn thành
      }
    });

    // Tính toán các chỉ số (mặc định là 0 nếu không có đơn hàng)
    const actualRevenue = monthlyOrders.length > 0 
      ? monthlyOrders.reduce((sum, order) => sum + parseFloat(order.total_price), 0)
      : 0;
    const actualOrders = monthlyOrders.length;

    // Mục tiêu động theo nhân viên
    const targetRevenue = user.targetRevenue || 1000000000; // 1 tỷ VND/tháng
    const targetOrders = user.targetOrders || 50; // 50 đơn/tháng

    // Tính % KPI (trọng số: doanh số 70%, số đơn 30%)
    const revenueWeight = 0.7;
    const ordersWeight = 0.3;

    const revenuePercentage = (actualRevenue / targetRevenue) * 100 * revenueWeight;
    const ordersPercentage = (actualOrders / targetOrders) * 100 * ordersWeight;
    const kpiPercentage = revenuePercentage + ordersPercentage;

    // Xác định trạng thái
    let status = /** @type {'pending' | 'achieved' | 'failed'} */ ('pending');
    if (kpiPercentage >= 100) {
      status = 'achieved';
    } else if (currentDate.getDate() === endDate.getDate()) {
      status = 'failed';
    }

    try {
      // Tìm KPI hiện tại của tháng
      const existingKPI = await SalesKPI.findOne({
        where: {
          userId: user.id,
          month: currentMonth,
          year: currentYear
        }
      });

      if (existingKPI) {
        // Cập nhật KPI nếu đã tồn tại
        await existingKPI.update({
          actualRevenue,
          actualOrders,
          kpiPercentage,
          status
        });
        return existingKPI;
      } else {
        // Tạo mới KPI nếu chưa tồn tại
        const newKPI = await SalesKPI.create({
          userId: user.id,
          month: currentMonth,
          year: currentYear,
          targetRevenue,
          actualRevenue,
          targetOrders,
          actualOrders,
          kpiPercentage,
          status
        });
        return newKPI;
      }
    } catch (error) {
      console.error(`Error processing KPI for user ${user.id}:`, error);
      throw error;
    }
  });

  // Thực hiện tất cả các promises
  try {
    const results = await Promise.all(kpiPromises);
    return results;
  } catch (error) {
    console.error('Error processing KPIs:', error);
    throw error;
  }
};

const getMySalesKPI = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Lấy KPI từ bảng SalesKPI
    const currentKPI = await SalesKPI.findOne({
      where: {
        userId,
        month: currentMonth,
        year: currentYear
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName']
        }
      ]
    });

    if (!currentKPI) {
      return res.status(404).json({
        message: 'Chưa có dữ liệu KPI cho tháng này'
      });
    }

    // Lấy danh sách đơn hàng trong tháng để hiển thị chi tiết
    const monthlyOrders = await ExportOrder.findAll({
      where: {
        userId,
        dateExport: {
          [Op.between]: [
            new Date(currentYear, currentMonth - 1, 1),
            new Date(currentYear, currentMonth, 0)
          ]
        },
        status: true
      },
      order: [['dateExport', 'DESC']]
    });

    // Tính % tiến độ và format số
    const revenueProgress = Number((currentKPI.actualRevenue / currentKPI.targetRevenue * 100).toFixed(2));
    const ordersProgress = Number((currentKPI.actualOrders / currentKPI.targetOrders * 100).toFixed(2));
    const kpiPercentage = Number(currentKPI.kpiPercentage || 0).toFixed(2);

    res.json({data:{
      
      kpiInfo: currentKPI,
      monthlyProgress: {
        actualRevenue: currentKPI.actualRevenue,
        targetRevenue: currentKPI.targetRevenue,
        actualOrders: currentKPI.actualOrders,
        targetOrders: currentKPI.targetOrders,
        revenueProgress,
        ordersProgress,
        kpiPercentage: parseFloat(kpiPercentage),
        status: currentKPI.status
      },
      monthlyOrders
    }
    });

  } catch (error) {
    res.status(500).json({
      message: 'Lỗi khi lấy thông tin KPI',
      error: error.message
    });
  }
};

const generateAllSaleKPIReport = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Lấy tất cả KPI của nhân viên sale trong tháng
    const allSalesKPI = await SalesKPI.findAll({
      where: {
        month: currentMonth,
        year: currentYear
      },
      include: [
        {
          model: User,
          as: 'user',
          where: { 
            role: 'SALE', 
            status: true 
          },
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['kpiPercentage', 'DESC']]
    });

    // Tổng hợp thống kê
    const summary = {
      totalEmployees: allSalesKPI.length,
      achievedTarget: allSalesKPI.filter(kpi => kpi.status === 'achieved').length,
      pending: allSalesKPI.filter(kpi => kpi.status === 'pending').length,
      failed: allSalesKPI.filter(kpi => kpi.status === 'failed').length,
      totalRevenue: allSalesKPI.reduce((sum, kpi) => sum + Number(kpi.actualRevenue || 0), 0),
      totalOrders: allSalesKPI.reduce((sum, kpi) => sum + Number(kpi.actualOrders || 0), 0)
    };

    // Format dữ liệu để trả về
    const employeesProgress = allSalesKPI.map(kpi => {
      // Convert các giá trị sang number và format
      const actualRevenue = Number(kpi.actualRevenue || 0);
      const targetRevenue = Number(kpi.targetRevenue || 1);
      const actualOrders = Number(kpi.actualOrders || 0);
      const targetOrders = Number(kpi.targetOrders || 1);
      const kpiPercentage = Number(kpi.kpiPercentage || 0);

      return {
        userId: kpi.userId,
        userName: kpi.user.fullName,
        email: kpi.user.email,
        kpiInfo: {
          targetRevenue,
          actualRevenue,
          targetOrders,
          actualOrders,
          kpiPercentage: Number(kpiPercentage.toFixed(2)),
          status: kpi.status
        },
        monthlyProgress: {
          revenueProgress: Number(((actualRevenue / targetRevenue) * 100).toFixed(2)),
          ordersProgress: Number(((actualOrders / targetOrders) * 100).toFixed(2))
        }
      };
    });

    res.json({
      data:{
        summary,
      employeesProgress
      }
    });

  } catch (error) {
    res.status(500).json({
      message: 'Lỗi khi lấy báo cáo KPI của tất cả nhân viên',
      error: error.message
    });
  }
};

  module.exports ={
    calculateMonthlyKPI,
    generateAllSaleKPIReport,
    getMySalesKPI
  }