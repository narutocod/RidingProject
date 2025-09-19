'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ratings', {
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
      rater_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User who is giving the rating'
      },
      rated_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User who is being rated'
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5
        },
        comment: 'Rating from 1 to 5 stars'
      },
      feedback: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional written feedback'
      },
      rating_type: {
        type: Sequelize.ENUM('rider_to_driver', 'driver_to_rider'),
        allowNull: false,
        comment: 'Direction of rating'
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

    // Create indexes for rating queries
    await queryInterface.addIndex('ratings', ['ride_id']);
    await queryInterface.addIndex('ratings', ['rater_id']);
    await queryInterface.addIndex('ratings', ['rated_user_id']);
    await queryInterface.addIndex('ratings', ['rating_type']);
    await queryInterface.addIndex('ratings', ['rating']);
    await queryInterface.addIndex('ratings', ['created_at']);

    // Create composite unique index to prevent duplicate ratings for same ride
    await queryInterface.addIndex('ratings', ['ride_id', 'rater_id', 'rating_type'], {
      unique: true,
      name: 'unique_rating_per_ride_rater_type'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ratings');
  }
};
