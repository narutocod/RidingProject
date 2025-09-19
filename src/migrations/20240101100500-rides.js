'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rides', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ride_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Public unique ride identifier'
      },
      rider_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      driver_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      vehicle_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'vehicles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      ride_type: {
        type: Sequelize.ENUM('economy', 'comfort', 'premium'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('requested', 'accepted', 'started', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'requested'
      },
      pickup_location: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Pickup location {latitude, longitude, address}'
      },
      drop_location: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Drop location {latitude, longitude, address}'
      },
      estimated_distance: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true,
        comment: 'Estimated distance in kilometers'
      },
      actual_distance: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true,
        comment: 'Actual distance traveled in kilometers'
      },
      estimated_duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Estimated duration in seconds'
      },
      actual_duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Actual duration in seconds'
      },
      estimated_fare: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Estimated fare in rupees'
      },
      actual_fare: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Final fare amount in rupees'
      },
      payment_method: {
        type: Sequelize.ENUM('cash', 'wallet', 'card', 'upi'),
        defaultValue: 'cash'
      },
      payment_status: {
        type: Sequelize.ENUM('pending', 'paid', 'failed', 'refunded'),
        defaultValue: 'pending'
      },
      ride_started_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      ride_completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancellation_reason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cancelled_by: {
        type: Sequelize.ENUM('rider', 'driver', 'admin'),
        allowNull: true
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

    // Create comprehensive indexes for ride queries
    await queryInterface.addIndex('rides', ['ride_id']);
    await queryInterface.addIndex('rides', ['rider_id']);
    await queryInterface.addIndex('rides', ['driver_id']);
    await queryInterface.addIndex('rides', ['vehicle_id']);
    await queryInterface.addIndex('rides', ['status']);
    await queryInterface.addIndex('rides', ['ride_type']);
    await queryInterface.addIndex('rides', ['payment_status']);
    await queryInterface.addIndex('rides', ['created_at']);
    await queryInterface.addIndex('rides', ['rider_id', 'status']);
    await queryInterface.addIndex('rides', ['driver_id', 'status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rides');
  }
};
