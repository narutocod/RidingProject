module.exports = (sequelize, DataTypes) => {
  const Rating = sequelize.define('Rating', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    rideId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'rides',
        key: 'id'
      },
      field: 'ride_id'
    },
    raterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'rater_id'
    },
    ratedUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'rated_user_id'
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ratingType: {
      type: DataTypes.ENUM('rider_to_driver', 'driver_to_rider'),
      allowNull: false,
      field: 'rating_type'
    },
    createdAt:{
        type: DataTypes.DATE,
        defaultValue: sequelize.NOW,
        allowNull: true
    },
    updatedAt:{
        type: DataTypes.DATE,
        defaultValue: sequelize.NOW,
        allowNull: true
    },
  }, {
    tableName: 'ratings',
    timestamps: true,
    underscored: true
  });

  Rating.associate = (models) => {
    Rating.belongsTo(models.Ride, {
      foreignKey: 'rideId',
      as: 'ride'
    });

    Rating.belongsTo(models.User, {
      foreignKey: 'raterId',
      as: 'rater'
    });

    Rating.belongsTo(models.User, {
      foreignKey: 'ratedUserId',
      as: 'ratedUser'
    });
  };

  return Rating;
};
