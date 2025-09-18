module.exports = (sequelize, DataTypes) => {
  const RideTracking = sequelize.define('RideTracking', {
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
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at'
    }
  }, {
    tableName: 'ride_tracking',
    timestamps: false,
    createdAt: 'created_at',
    indexes: [
      {
        fields: ['ride_id', 'timestamp']
      }
    ]
  });

  RideTracking.associate = (models) => {
    RideTracking.belongsTo(models.Ride, {
      foreignKey: 'rideId',
      as: 'ride'
    });
  };

  return RideTracking;
};
