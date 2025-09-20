/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get all users
    const users = await queryInterface.sequelize.query(
      'SELECT id, email FROM users ORDER BY id',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) return;

    const walletData = [];

    for (const user of users) {
      // ✅ Skip if wallet already exists for this user
      const existingWallet = await queryInterface.rawSelect(
        'wallets',
        { where: { user_id: user.id } },
        ['id']
      );
      if (existingWallet) continue;

      let walletInfo = {};

      switch (user.email) {
        case 'admin@rideshare.com':
          walletInfo = { balance: 0.0, total_earnings: 0.0, total_spent: 0.0 };
          break;
        case 'john.rider@example.com':
          walletInfo = { balance: 245.75, total_earnings: 500.0, total_spent: 254.25 };
          break;
        case 'jane.smith@example.com':
          walletInfo = { balance: 89.5, total_earnings: 1000.0, total_spent: 910.5 };
          break;
        case 'robert.j@example.com':
          walletInfo = { balance: 150.0, total_earnings: 200.0, total_spent: 50.0 };
          break;
        case 'mike.driver@example.com':
          walletInfo = { balance: 3456.8, total_earnings: 167778.68, total_spent: 164321.88 };
          break;
        case 'sarah.wilson@example.com':
          walletInfo = { balance: 2890.25, total_earnings: 121104.23, total_spent: 118214.0 };
          break;
        case 'alex.kumar@example.com':
          walletInfo = { balance: 0.0, total_earnings: 0.0, total_spent: 0.0 };
          break;
        case 'david.singh@example.com':
          walletInfo = { balance: 1234.5, total_earnings: 80406.45, total_spent: 79171.95 };
          break;
        default:
          walletInfo = { balance: 0.0, total_earnings: 0.0, total_spent: 0.0 };
      }

      walletData.push({
        user_id: user.id,
        balance: walletInfo.balance,
        total_earnings: walletInfo.total_earnings,
        total_spent: walletInfo.total_spent,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    if (walletData.length > 0) {
      await queryInterface.bulkInsert('wallets', walletData);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('wallets', null, {});
  },
};
