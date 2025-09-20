'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('wallet_transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      wallet_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'wallets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      transaction_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unique transaction identifier'
      },
      type: {
        type: Sequelize.ENUM('credit', 'debit'),
        allowNull: false,
        comment: 'Transaction type - money in or out'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Transaction amount (always positive)'
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Human-readable transaction description'
      },
      reference_type: {
        type: Sequelize.ENUM('ride_payment', 'ride_refund', 'wallet_topup', 'admin_adjustment', 'earnings'),
        allowNull: false,
        comment: 'Category of transaction'
      },
      reference_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID of related entity (ride, payment, etc.)'
      },
      balance_after: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Wallet balance after this transaction'
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

    // Create indexes for wallet transaction queries
    await queryInterface.addIndex('wallet_transactions', ['wallet_id']);
    await queryInterface.addIndex('wallet_transactions', ['transaction_id']);
    await queryInterface.addIndex('wallet_transactions', ['type']);
    await queryInterface.addIndex('wallet_transactions', ['reference_type']);
    await queryInterface.addIndex('wallet_transactions', ['reference_type', 'reference_id']);
    await queryInterface.addIndex('wallet_transactions', ['created_at']);
    await queryInterface.addIndex('wallet_transactions', ['wallet_id', 'created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('wallet_transactions');
  }
};
