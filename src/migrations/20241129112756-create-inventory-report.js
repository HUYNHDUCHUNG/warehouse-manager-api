'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('InventoryReports', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      productId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      beginningInventory: {
        type: Sequelize.STRING,
        defaultValue: 0
      },
      quantityImported: {
        type: Sequelize.STRING,
        defaultValue: 0
      },
      quantityExported: {
        type: Sequelize.STRING,
        defaultValue: 0
      },
      endingInventory: {
        type: Sequelize.STRING,
        defaultValue: 0
      },
      inventoryValue: {
        type: Sequelize.STRING,
      },
      unitPrice: {
        type: Sequelize.STRING,
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

    // Thêm index để tăng tốc độ truy vấn
    await queryInterface.addIndex('InventoryReports', ['productId', 'month', 'year'], {
      unique: true,
      name: 'unique_product_month_year'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('InventoryReports');
  }
};