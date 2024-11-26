'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SalesKPIs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      targetRevenue: {
        type: Sequelize.STRING, // Mục tiêu doanh số (VND)
        allowNull: false
      },
      actualRevenue: {
        type: Sequelize.STRING, // Doanh số thực tế
        allowNull: false
      },
      targetOrders: {
        type: Sequelize.INTEGER, // Số đơn hàng mục tiêu
        allowNull: false
      },
      actualOrders: {
        type: Sequelize.INTEGER, // Số đơn hàng thực tế
        allowNull: false
      },
      kpiPercentage: {
        type: Sequelize.DECIMAL(5, 2), // Phần trăm KPI đạt được
        allowNull: false
      },
      status: {
        type: Sequelize.STRING, // 'pending', 'achieved', 'failed'
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SalesKPIs');
  }
};
