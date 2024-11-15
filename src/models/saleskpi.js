'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SalesKPI extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      SalesKPI.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  SalesKPI.init({
    userId: DataTypes.STRING,
    month: DataTypes.INTEGER,
    year: DataTypes.INTEGER,
    targetRevenue: DataTypes.DECIMAL(10, 2), // Mục tiêu doanh số (VND)
    actualRevenue: DataTypes.DECIMAL(10, 2), // Doanh số thực tế
    targetOrders: DataTypes.INTEGER, // Số đơn hàng mục tiêu
    actualOrders: DataTypes.INTEGER, // Số đơn hàng thực tế
    kpiPercentage: DataTypes.DECIMAL(5, 2), // Phần trăm KPI đạt được
    status: DataTypes.STRING // 'pending', 'achieved', 'failed'
  }, {
    sequelize,
    modelName: 'SalesKPI',
  });

  return SalesKPI;
};