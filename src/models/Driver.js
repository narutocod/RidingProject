module.exports = (sequelize, DataTypes) => {
  const Driver = sequelize.define('Driver', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'license_number'
    },
    licenseExpiry: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'license_expiry'
    },
    driverLicensePath: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'driver_license_path'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified'
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_online'
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_available'
    },
    currentLocation: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'current_location'
    },
    totalRides: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_rides'
    },
    totalEarnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      field: 'total_earnings'
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 5.00,
      field: 'average_rating'
    },
    documentsVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'documents_verified'
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
    tableName: 'drivers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Driver.associate = (models) => {
    Driver.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    Driver.hasMany(models.Vehicle, {
      foreignKey: 'driverId',
      as: 'vehicles'
    });

    Driver.hasMany(models.DriverLocation, {
      foreignKey: 'driverId',
      as: 'locationHistory'
    });
  };

  return Driver;
};
