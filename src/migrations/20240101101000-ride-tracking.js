'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ride_tracking', {
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
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false,
        comment: 'GPS latitude during ride'
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false,
        comment: 'GPS longitude during ride'
      },
      accuracy: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
        comment: 'GPS accuracy in meters'
      },
      heading: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Direction of movement in degrees'
      },
      speed: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Vehicle speed in km/h'
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'When this location was recorded during ride'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes for ride tracking queries
    await queryInterface.addIndex('ride_tracking', ['ride_id']);
    await queryInterface.addIndex('ride_tracking', ['ride_id', 'timestamp']);
    await queryInterface.addIndex('ride_tracking', ['timestamp']);
    await queryInterface.addIndex('ride_tracking', ['created_at']);

    // Composite index for ride route queries
    await queryInterface.addIndex('ride_tracking', ['ride_id', 'timestamp', 'latitude', 'longitude'], {
      name: 'ride_tracking_route_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ride_tracking');
  }
};
