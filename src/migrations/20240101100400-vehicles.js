'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehicles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      driver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'drivers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      vehicle_type: {
        type: Sequelize.ENUM('car', 'bike', 'auto'),
        allowNull: false
      },
      vehicle_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Vehicle registration number'
      },
      vehicle_brand: {
        type: Sequelize.STRING,
        allowNull: false
      },
      vehicle_model: {
        type: Sequelize.STRING,
        allowNull: false
      },
      vehicle_color: {
        type: Sequelize.STRING,
        allowNull: false
      },
      manufacturing_year: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      registration_path: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Path to vehicle registration document'
      },
      insurance_path: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Path to vehicle insurance document'
      },
      registration_expiry: {
        type: Sequelize.DATE,
        allowNull: true
      },
      insurance_expiry: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Admin verification status for documents'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Vehicle active status'
      },
      seating_capacity: {
        type: Sequelize.INTEGER,
        defaultValue: 4,
        comment: 'Number of passengers (excluding driver)'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create indexes
    await queryInterface.addIndex('vehicles', ['driver_id']);
    await queryInterface.addIndex('vehicles', ['vehicle_number']);
    await queryInterface.addIndex('vehicles', ['vehicle_type']);
    await queryInterface.addIndex('vehicles', ['is_verified', 'is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vehicles');
  }
};
