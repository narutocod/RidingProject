'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('drivers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      license_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      license_expiry: {
        type: Sequelize.DATE,
        allowNull: false
      },
      driver_license_path: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Path to uploaded driver license document'
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Admin verification status'
      },
      is_online: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Current online status'
      },
      is_available: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Available for ride requests when online'
      },
      current_location: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Current GPS location {latitude, longitude, timestamp}'
      },
      total_rides: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_earnings: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      average_rating: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 5.00
      },
      documents_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    // Create indexes for driver matching and queries
    await queryInterface.addIndex('drivers', ['user_id']);
    await queryInterface.addIndex('drivers', ['license_number']);
    await queryInterface.addIndex('drivers', ['is_online', 'is_available']);
    await queryInterface.addIndex('drivers', ['is_verified']);
    await queryInterface.addIndex('drivers', ['average_rating']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('drivers');
  }
};
