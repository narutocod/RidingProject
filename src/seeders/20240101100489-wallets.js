/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if wallets already exist
    const existingWalletsCount = await queryInterface.rawSelect(
      'wallets',
      {},
      ['COUNT(*) as count']
    );

    if (existingWalletsCount && existingWalletsCount.count > 0) {
      return;
    }

    // Get all user IDs
    const users = await queryInterface.sequelize.query(
      'SELECT id, email FROM users ORDER BY id',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) {
      return;
    }

    const walletData = [];

    for (const user of users) {
      let walletInfo = {};

      // Set wallet data based on user email/role
      switch (user.email) {
        case 'admin@rideshare.com':
          walletInfo = {
            balance: 0.00,
            total_earnings: 0.00,
            total_spent: 0.00
          };
          break;
        case 'john.rider@example.com':
          walletInfo = {
            balance: 245.75,
            total_earnings: 500.00,
            total_spent: 254.25
          };
          break;
        case 'jane.smith@example.com':
          walletInfo = {
            balance: 89.50,
            total_earnings: 1000.00,
            total_spent: 910.50
          };
          break;
        case 'robert.j@example.com':
          walletInfo = {
            balance: 150.00,
            total_earnings: 200.00,
            total_spent: 50.00
          };
          break;
        case 'mike.driver@example.com':
          walletInfo = {
            balance: 3456.80,
            total_earnings: 167778.68,
            total_spent: 164321.88
          };
          break;
        case 'sarah.wilson@example.com':
          walletInfo = {
            balance: 2890.25,
            total_earnings: 121104.23,
            total_spent: 118214.00
          };
          break;
        case 'alex.kumar@example.com':
          walletInfo = {
            balance: 0.00,
            total_earnings: 0.00,
            total_spent: 0.00
          };
          break;
        case 'david.singh@example.com':
          walletInfo = {
            balance: 1234.50,
            total_earnings: 80406.45,
            total_spent: 79171.95
          };
          break;
        default:
          walletInfo = {
            balance: 0.00,
            total_earnings: 0.00,
            total_spent: 0.00
          };
      }

      walletData.push({
        user_id: user.id,
        balance: walletInfo.balance,
        total_earnings: walletInfo.total_earnings,
        total_spent: walletInfo.total_spent,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    await queryInterface.bulkInsert('wallets', walletData, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('wallets', null, {});
  }
};
