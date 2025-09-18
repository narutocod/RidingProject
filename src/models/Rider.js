module.exports = (sequelize, DataTypes) => {
  const Rider = sequelize.define('Rider', {
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
    homeLocation: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'home_location'
    },
    workLocation: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'work_location'
    },
    emergencyContact: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'emergency_contact'
    },
    totalRides: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_rides'
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 5.00,
      field: 'average_rating'
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
    tableName: 'riders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Rider.associate = (models) => {
    Rider.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Rider;
};
