module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isNumeric: true,
        len: [10, 10]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'password_hash'
    },
    role: {
      type: DataTypes.ENUM('rider', 'driver', 'admin'),
      allowNull: false,
      defaultValue: 'rider'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified'
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'profile_picture'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true
  });

  User.associate = (models) => {
    // User can be a rider
    User.hasOne(models.Rider, {
      foreignKey: 'userId',
      as: 'riderProfile'
    });

    // User can be a driver
    User.hasOne(models.Driver, {
      foreignKey: 'userId',
      as: 'driverProfile'
    });

    // User has many rides as rider
    User.hasMany(models.Ride, {
      foreignKey: 'riderId',
      as: 'ridesAsRider'
    });

    // User has many rides as driver
    User.hasMany(models.Ride, {
      foreignKey: 'driverId',
      as: 'ridesAsDriver'
    });

    // User has wallet
    User.hasOne(models.Wallet, {
      foreignKey: 'userId',
      as: 'wallet'
    });
  };

  return User;
};
