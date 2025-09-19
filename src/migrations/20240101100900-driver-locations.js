'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('driver_locations', {
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
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false,
        comment: 'GPS latitude coordinate'
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false,
        comment: 'GPS longitude coordinate'
      },
      accuracy: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
        comment: 'GPS accuracy in meters'
      },
      heading: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Direction of movement in degrees (0-360)'
      },
      speed: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Speed in km/h'
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Reverse geocoded address'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Whether this location record is active'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        comment: 'When this location was recorded'
      }
    });

    // Create indexes for geospatial and time-based queries
    await queryInterface.addIndex('driver_locations', ['driver_id']);
    await queryInterface.addIndex('driver_locations', ['latitude', 'longitude']);
    await queryInterface.addIndex('driver_locations', ['driver_id', 'created_at']);
    await queryInterface.addIndex('driver_locations', ['created_at']);
    await queryInterface.addIndex('driver_locations', ['is_active']);

    // Composite index for proximity searches
    await queryInterface.addIndex('driver_locations', ['latitude', 'longitude', 'is_active', 'created_at'], {
      name: 'driver_locations_geo_active_time'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('driver_locations');
  }
};
