const createError = require('http-errors');
const { Op } = require('sequelize');
const {ExportOrder,PurchaseOrder, sequelize} = require('~/models');

const getTotalIncomeCurrentMonth = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Tính tổng thu nhập tháng hiện tại
    const currentMonthResult = await ExportOrder.findOne({
      attributes: [
        [sequelize.fn('COALESCE', 
          sequelize.fn('SUM', 
            sequelize.cast(sequelize.col('total_price'), 'DECIMAL(15,2)')
          ), 
          0
        ), 'total_income']
      ],
      where: {
        [Op.and]: [
          sequelize.where(sequelize.fn('YEAR', sequelize.col('dateExport')), currentYear),
          sequelize.where(sequelize.fn('MONTH', sequelize.col('dateExport')), currentMonth + 1),
          // { statusOrder: true }
        ]
      }
    });

    // Tính tổng thu nhập tháng trước
    const previousMonthResult = await ExportOrder.findOne({
      attributes: [
        [sequelize.fn('COALESCE', 
          sequelize.fn('SUM', 
            sequelize.cast(sequelize.col('total_price'), 'DECIMAL(15,2)')
          ), 
          0
        ), 'total_income']
      ],
      where: {
        [Op.and]: [
          sequelize.where(
            sequelize.fn('YEAR', sequelize.col('dateExport')),
            currentMonth === 0 ? currentYear - 1 : currentYear
          ),
          sequelize.where(
            sequelize.fn('MONTH', sequelize.col('dateExport')),
            currentMonth === 0 ? 12 : currentMonth
          ),
          // { statusOrder: true }
        ]
      }
    });

    const currentMonthIncome = parseFloat(currentMonthResult.getDataValue('total_income') || 0);
    const previousMonthIncome = parseFloat(previousMonthResult.getDataValue('total_income') || 0);

    // Tính tỷ lệ tăng trưởng
    let growthRate = 0;
    if (previousMonthIncome > 0) {
      growthRate = ((currentMonthIncome - previousMonthIncome) / previousMonthIncome * 100).toFixed(2);
    } else if (currentMonthIncome > 0) {
      growthRate = 100; // Nếu tháng trước = 0 và tháng này > 0 thì tăng 100%
    }

    // Format định dạng tiền tệ
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    return res.status(200).json({
      success: true,
      data: {
        current_month: {
          year: currentYear,
          month: currentMonth + 1,
          income: currentMonthIncome,
          formatted_income: formatCurrency(currentMonthIncome)
        },
        previous_month: {
          year: currentMonth === 0 ? currentYear - 1 : currentYear,
          month: currentMonth === 0 ? 12 : currentMonth,
          income: previousMonthIncome,
          formatted_income: formatCurrency(previousMonthIncome)
        },
        growth_rate: growthRate,
        growth_direction: growthRate > 0 ? 'increase' : growthRate < 0 ? 'decrease' : 'stable'
      }
    });

  } catch (error) {
    console.error('Error calculating growth rate:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


const getMonthlyOrderStats = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-based
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Lấy thống kê tháng hiện tại
    const currentMonthStats = await ExportOrder.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders'],
        [
          sequelize.fn('SUM', 
            sequelize.literal('CASE WHEN status = 1 THEN 1 ELSE 0 END')
          ),
          'completed_orders'
        ],
        [
          sequelize.fn('SUM', 
            sequelize.literal('CASE WHEN status = 0 THEN 1 ELSE 0 END')
          ),
          'pending_orders'
        ]
      ],
      where: sequelize.and(
        sequelize.where(sequelize.fn('MONTH', sequelize.col('dateExport')), currentMonth),
        sequelize.where(sequelize.fn('YEAR', sequelize.col('dateExport')), currentYear)
      )
    });

    // Lấy thống kê tháng trước
    const previousMonthStats = await ExportOrder.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders']
      ],
      where: sequelize.and(
        sequelize.where(sequelize.fn('MONTH', sequelize.col('dateExport')), previousMonth),
        sequelize.where(sequelize.fn('YEAR', sequelize.col('dateExport')), previousYear)
      )
    });

    // Parse kết quả
    const currentStats = currentMonthStats?.get({ plain: true }) || {
      total_orders: 0,
      completed_orders: 0,
      pending_orders: 0
    };
    
    const previousStats = previousMonthStats?.get({ plain: true }) || {
      total_orders: 0
    };

    // Convert từ string sang number
    const currentTotal = parseInt(currentStats.total_orders || 0);
    const completedOrders = parseInt(currentStats.completed_orders || 0);
    const pendingOrders = parseInt(currentStats.pending_orders || 0);
    const previousTotal = parseInt(previousStats.total_orders || 0);

    // Tính tỷ lệ tăng trưởng
    let growthRate = 0;
    if (previousTotal > 0) {
      growthRate = ((currentTotal - previousTotal) / previousTotal * 100).toFixed(2);
    } else if (currentTotal > 0) {
      growthRate = 100;
    }

    // Format số với dấu phẩy ngăn cách hàng nghìn
    const formatNumber = (num) => {
      return new Intl.NumberFormat('vi-VN').format(num);
    };

    return res.status(200).json({
      success: true,
      data: {
        current_month: {
          year: currentYear,
          month: currentMonth,
          total_orders: currentTotal,
          formatted_total: formatNumber(currentTotal),
          completed_orders: completedOrders,
          pending_orders: pendingOrders,
          completion_rate: currentTotal > 0 
            ? ((completedOrders / currentTotal) * 100).toFixed(2) 
            : 0
        },
        previous_month: {
          year: previousYear,
          month: previousMonth,
          total_orders: previousTotal,
          formatted_total: formatNumber(previousTotal)
        },
        growth_rate: parseFloat(growthRate),
        growth_direction: growthRate > 0 ? 'increase' : growthRate < 0 ? 'decrease' : 'stable'
      }
    });

  } catch (error) {
    console.error('Error calculating order statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getMonthlyPurchaseOrderStats = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Lấy thống kê tháng hiện tại
    const currentMonthStats = await PurchaseOrder.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders'],
        [
          sequelize.fn('SUM', 
            sequelize.literal('CASE WHEN total_price > 0 THEN 1 ELSE 0 END')
          ),
          'completed_orders'
        ],
        [
          sequelize.fn('SUM', 
            sequelize.literal('CASE WHEN total_price = 0 OR total_price IS NULL THEN 1 ELSE 0 END')
          ),
          'pending_orders'
        ],
        [
          sequelize.fn('SUM', sequelize.col('total_price')),
          'total_amount'
        ]
      ],
      where: sequelize.and(
        sequelize.where(sequelize.fn('MONTH', sequelize.col('dateImport')), currentMonth),
        sequelize.where(sequelize.fn('YEAR', sequelize.col('dateImport')), currentYear)
      )
    });

    // Lấy thống kê tháng trước
    const previousMonthStats = await PurchaseOrder.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders'],
        [
          sequelize.fn('SUM', sequelize.col('total_price')),
          'total_amount'
        ]
      ],
      where: sequelize.and(
        sequelize.where(sequelize.fn('MONTH', sequelize.col('dateImport')), previousMonth),
        sequelize.where(sequelize.fn('YEAR', sequelize.col('dateImport')), previousYear)
      )
    });

    // Parse kết quả
    const currentStats = currentMonthStats?.get({ plain: true }) || {
      total_orders: 0,
      completed_orders: 0,
      pending_orders: 0,
      total_amount: 0
    };
    
    const previousStats = previousMonthStats?.get({ plain: true }) || {
      total_orders: 0,
      total_amount: 0
    };

    // Convert từ string sang number
    const currentTotal = parseInt(currentStats.total_orders || 0);
    const completedOrders = parseInt(currentStats.completed_orders || 0);
    const pendingOrders = parseInt(currentStats.pending_orders || 0);
    const currentAmount = parseFloat(currentStats.total_amount || 0);
    const previousTotal = parseInt(previousStats.total_orders || 0);
    const previousAmount = parseFloat(previousStats.total_amount || 0);

    // Tính tỷ lệ tăng trưởng đơn hàng
    let orderGrowthRate = 0;
    if (previousTotal > 0) {
      orderGrowthRate = ((currentTotal - previousTotal) / previousTotal * 100).toFixed(2);
    } else if (currentTotal > 0) {
      orderGrowthRate = 100;
    }

    // Tính tỷ lệ tăng trưởng giá trị
    let amountGrowthRate = 0;
    if (previousAmount > 0) {
      amountGrowthRate = ((currentAmount - previousAmount) / previousAmount * 100).toFixed(2);
    } else if (currentAmount > 0) {
      amountGrowthRate = 100;
    }

    // Format số với dấu phẩy ngăn cách hàng nghìn
    const formatNumber = (num) => {
      return new Intl.NumberFormat('vi-VN').format(num);
    };

    return res.status(200).json({
      success: true,
      data: {
        current_month: {
          year: currentYear,
          month: currentMonth,
          total_orders: currentTotal,
          formatted_total: formatNumber(currentTotal),
          completed_orders: completedOrders,
          pending_orders: pendingOrders,
          total_amount: currentAmount,
          formatted_amount: formatNumber(currentAmount),
          completion_rate: currentTotal > 0 
            ? ((completedOrders / currentTotal) * 100).toFixed(2) 
            : 0
        },
        previous_month: {
          year: previousYear,
          month: previousMonth,
          total_orders: previousTotal,
          formatted_total: formatNumber(previousTotal),
          total_amount: previousAmount,
          formatted_amount: formatNumber(previousAmount)
        },
        growth_rates: {
          orders: {
            value: parseFloat(orderGrowthRate),
            direction: orderGrowthRate > 0 ? 'increase' : orderGrowthRate < 0 ? 'decrease' : 'stable'
          },
          amount: {
            value: parseFloat(amountGrowthRate),
            direction: amountGrowthRate > 0 ? 'increase' : amountGrowthRate < 0 ? 'decrease' : 'stable'
          }
        }
      }
    });

  } catch (error) {
    console.error('Error calculating purchase order statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};



module.exports ={
    getTotalIncomeCurrentMonth,
    getMonthlyOrderStats,
    getMonthlyPurchaseOrderStats
}