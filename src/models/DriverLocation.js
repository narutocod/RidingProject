module.exports = (sequelize, DataTypes) => {
  const DriverLocation = sequelize.define('DriverLocation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'drivers',
        key: 'id'
      },
      field: 'driver_id'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    accuracy: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true
    },
    heading: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    speed: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'driver_locations',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ['driver_id', 'created_at']
      },
      {
        fields: ['latitude', 'longitude']
      }
    ]
  });

  DriverLocation.associate = (models) => {
    DriverLocation.belongsTo(models.Driver, {
      foreignKey: 'driverId',
      as: 'driver'
    });
  };

  return DriverLocation;
};
