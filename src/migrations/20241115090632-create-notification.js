'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Notifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING
      },
      message: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.ENUM('inventory_warning', 'new_order', 'import_suggestion'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('unread', 'read'),
        defaultValue: 'unread'
      },
      referenceId: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'ID tham chiếu đến đối tượng liên quan (đơn hàng, sản phẩm...)'
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
    await queryInterface.dropTable('Notifications');
  }
};