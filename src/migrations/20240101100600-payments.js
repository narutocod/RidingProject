'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ride_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'rides',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      payment_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unique payment transaction ID'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Payment amount in rupees'
      },
      payment_method: {
        type: Sequelize.ENUM('cash', 'wallet', 'card', 'upi'),
        allowNull: false
      },
      payment_status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
        allowNull: false,
        defaultValue: 'pending'
      },
      gateway_transaction_id: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Transaction ID from payment gateway'
      },
      gateway_response: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Complete response from payment gateway'
      },
      failure_reason: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Reason for payment failure'
      },
      refund_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Refunded amount if applicable'
      },
      refund_reason: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Reason for refund'
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When payment was completed/failed'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes for payment queries
    await queryInterface.addIndex('payments', ['payment_id']);
    await queryInterface.addIndex('payments', ['ride_id']);
    await queryInterface.addIndex('payments', ['user_id']);
    await queryInterface.addIndex('payments', ['payment_status']);
    await queryInterface.addIndex('payments', ['payment_method']);
    await queryInterface.addIndex('payments', ['created_at']);
    await queryInterface.addIndex('payments', ['gateway_transaction_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
  }
};
