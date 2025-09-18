module.exports = (sequelize, DataTypes) => {
  const Ride = sequelize.define('Ride', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    rideId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'ride_id'
    },
    riderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'rider_id'
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'driver_id'
    },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'vehicles',
        key: 'id'
      },
      field: 'vehicle_id'
    },
    rideType: {
      type: DataTypes.ENUM('economy', 'comfort', 'premium'),
      allowNull: false,
      field: 'ride_type'
    },
    status: {
      type: DataTypes.ENUM('requested', 'accepted', 'started', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'requested'
    },
    pickupLocation: {
      type: DataTypes.JSON,
      allowNull: false,
      field: 'pickup_location'
    },
    dropLocation: {
      type: DataTypes.JSON,
      allowNull: false,
      field: 'drop_location'
    },
    estimatedDistance: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      field: 'estimated_distance'
    },
    actualDistance: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      field: 'actual_distance'
    },
    estimatedDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'estimated_duration'
    },
    actualDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'actual_duration'
    },
    estimatedFare: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'estimated_fare'
    },
    actualFare: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'actual_fare'
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'wallet', 'card', 'upi'),
      defaultValue: 'cash',
      field: 'payment_method'
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
      defaultValue: 'pending',
      field: 'payment_status'
    },
    rideStartedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'ride_started_at'
    },
    rideCompletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'ride_completed_at'
    },
    cancellationReason: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'cancellation_reason'
    },
    cancelledBy: {
      type: DataTypes.ENUM('rider', 'driver', 'admin'),
      allowNull: true,
      field: 'cancelled_by'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at'
    }
  }, {
    tableName: 'rides',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Ride.associate = (models) => {
    Ride.belongsTo(models.User, {
      foreignKey: 'riderId',
      as: 'rider'
    });

    Ride.belongsTo(models.User, {
      foreignKey: 'driverId',
      as: 'driver'
    });

    Ride.belongsTo(models.Vehicle, {
      foreignKey: 'vehicleId',
      as: 'vehicle'
    });

    Ride.hasMany(models.RideTracking, {
      foreignKey: 'rideId',
      as: 'trackingData'
    });

    Ride.hasMany(models.Rating, {
      foreignKey: 'rideId',
      as: 'ratings'
    });

    Ride.hasOne(models.Payment, {
      foreignKey: 'rideId',
      as: 'payment'
    });
  };

  return Ride;
};
