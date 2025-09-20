'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('riders', {
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
      home_location: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Stores {latitude, longitude, address} for home location'
      },
      work_location: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Stores {latitude, longitude, address} for work location'
      },
      emergency_contact: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Stores {name, phone, relation} for emergency contact'
      },
      total_rides: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      average_rating: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 5.00
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

    // Create indexes
    await queryInterface.addIndex('riders', ['user_id']);
    await queryInterface.addIndex('riders', ['average_rating']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('riders');
  }
};
