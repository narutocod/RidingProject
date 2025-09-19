const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Users data with plain password for hashing
    const users = [
      {
        name: 'System Admin',
        phone: '9999999999',
        email: 'admin@rideshare.com',
        passwordPlain: 'admin123',
        role: 'admin',
        is_active: true,
        is_verified: true,
        profile_picture: null,
        last_login_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'John Rider',
        phone: '9876543210',
        email: 'john.rider@example.com',
        passwordPlain: 'password123',
        role: 'rider',
        is_active: true,
        is_verified: true,
        profile_picture: 'uploads/profiles/john_profile.jpg',
        last_login_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),     // 30 days ago
        updated_at: new Date()
      },
      {
        name: 'Jane Smith',
        phone: '9876543211',
        email: 'jane.smith@example.com',
        passwordPlain: 'password123',
        role: 'rider',
        is_active: true,
        is_verified: true,
        profile_picture: 'uploads/profiles/jane_profile.jpg',
        last_login_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),     // 25 days ago
        updated_at: new Date()
      },
      {
        name: 'Robert Johnson',
        phone: '9876543212',
        email: 'robert.j@example.com',
        passwordPlain: 'password123',
        role: 'rider',
        is_active: true,
        is_verified: false,
        profile_picture: null,
        last_login_at: null,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),      // 5 days ago
        updated_at: new Date()
      },
      {
        name: 'Mike Driver',
        phone: '9876543213',
        email: 'mike.driver@example.com',
        passwordPlain: 'password123',
        role: 'driver',
        is_active: true,
        is_verified: true,
        profile_picture: 'uploads/profiles/mike_profile.jpg',
        last_login_at: new Date(Date.now() - 3 * 60 * 60 * 1000),        // 3 hours ago
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),      // 60 days ago
        updated_at: new Date()
      },
      {
        name: 'Sarah Wilson',
        phone: '9876543214',
        email: 'sarah.wilson@example.com',
        passwordPlain: 'password123',
        role: 'driver',
        is_active: true,
        is_verified: true,
        profile_picture: 'uploads/profiles/sarah_profile.jpg',
        last_login_at: new Date(Date.now() - 6 * 60 * 60 * 1000),        // 6 hours ago
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),      // 45 days ago
        updated_at: new Date()
      },
      {
        name: 'Alex Kumar',
        phone: '9876543215',
        email: 'alex.kumar@example.com',
        passwordPlain: 'password123',
        role: 'driver',
        is_active: true,
        is_verified: false,
        profile_picture: null,
        last_login_at: new Date(Date.now() - 12 * 60 * 60 * 1000),       // 12 hours ago
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),      // 10 days ago
        updated_at: new Date()
      },
      {
        name: 'David Singh',
        phone: '9876543216',
        email: 'david.singh@example.com',
        passwordPlain: 'password123',
        role: 'driver',
        is_active: false,
        is_verified: true,
        profile_picture: null,
        last_login_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),   // 7 days ago
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),      // 90 days ago
        updated_at: new Date()
      }
    ];

    for (const user of users) {
      const exists = await queryInterface.rawSelect(
        'users',
        { where: { phone: user.phone } },
        ['id']
      );

      if (!exists) {
        const hashedPassword = await bcrypt.hash(user.passwordPlain, 12);
        await queryInterface.bulkInsert('users', [{
          name: user.name,
          phone: user.phone,
          email: user.email,
          password_hash: hashedPassword,
          role: user.role,
          is_active: user.is_active,
          is_verified: user.is_verified,
          profile_picture: user.profile_picture,
          last_login_at: user.last_login_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
        }]);
        console.log(`Inserted user: ${user.phone}`);
      } else {
        console.log(`User already exists: ${user.phone}`);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const phones = [
      '9999999999',
      '9876543210',
      '9876543211',
      '9876543212',
      '9876543213',
      '9876543214',
      '9876543215',
      '9876543216'
    ];
    await queryInterface.bulkDelete('users', { phone: phones }, {});
  }
};
