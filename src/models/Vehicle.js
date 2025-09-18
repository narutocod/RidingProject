module.exports = (sequelize, DataTypes) => {
  const Vehicle = sequelize.define('Vehicle', {
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
    vehicleType: {
      type: DataTypes.ENUM('car', 'bike', 'auto'),
      allowNull: false,
      field: 'vehicle_type'
    },
    vehicleNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'vehicle_number'
    },
    vehicleBrand: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'vehicle_brand'
    },
    vehicleModel: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'vehicle_model'
    },
    vehicleColor: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'vehicle_color'
    },
    manufacturingYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'manufacturing_year'
    },
    registrationPath: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'registration_path'
    },
    insurancePath: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'insurance_path'
    },
    registrationExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'registration_expiry'
    },
    insuranceExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'insurance_expiry'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    seatingCapacity: {
      type: DataTypes.INTEGER,
      defaultValue: 4,
      field: 'seating_capacity'
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
    tableName: 'vehicles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Vehicle.associate = (models) => {
    Vehicle.belongsTo(models.Driver, {
      foreignKey: 'driverId',
      as: 'driver'
    });
  };

  return Vehicle;
};
