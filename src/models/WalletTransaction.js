module.exports = (sequelize, DataTypes) => {
  const WalletTransaction = sequelize.define('WalletTransaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    walletId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'wallets',
        key: 'id'
      },
      field: 'wallet_id'
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'transaction_id'
    },
    type: {
      type: DataTypes.ENUM('credit', 'debit'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    referenceType: {
      type: DataTypes.ENUM('ride_payment', 'ride_refund', 'wallet_topup', 'admin_adjustment', 'earnings'),
      allowNull: false,
      field: 'reference_type'
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reference_id'
    },
    balanceAfter: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'balance_after'
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
    tableName: 'wallet_transactions',
    timestamps: true,
    underscored: true
  });

  WalletTransaction.associate = (models) => {
    WalletTransaction.belongsTo(models.Wallet, {
      foreignKey: 'walletId',
      as: 'wallet'
    });
  };

  return WalletTransaction;
};
