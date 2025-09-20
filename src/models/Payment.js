module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
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
    paymentId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'payment_id'
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'wallet', 'card', 'upi'),
      allowNull: false,
      field: 'payment_method'
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
      field: 'payment_status'
    },
    gatewayTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'gateway_transaction_id'
    },
    gatewayResponse: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'gateway_response'
    },
    failureReason: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'failure_reason'
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'refund_amount'
    },
    refundReason: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'refund_reason'
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'processed_at'
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
    tableName: 'payments',
    timestamps: true,
    underscored: true
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.Ride, {
      foreignKey: 'rideId',
      as: 'ride'
    });

    Payment.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Payment;
};
