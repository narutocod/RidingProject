/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ✅ Check if drivers already exist
    const existingDriver = await queryInterface.rawSelect("drivers", {}, ["id"]);

    if (existingDriver) {
      return;
    }

    // ✅ Get user IDs for drivers
    const mikeUserId = await queryInterface.rawSelect(
      "users",
      { where: { email: "mike.driver@example.com" } },
      ["id"]
    );

    const sarahUserId = await queryInterface.rawSelect(
      "users",
      { where: { email: "sarah.wilson@example.com" } },
      ["id"]
    );

    const alexUserId = await queryInterface.rawSelect(
      "users",
      { where: { email: "alex.kumar@example.com" } },
      ["id"]
    );

    const davidUserId = await queryInterface.rawSelect(
      "users",
      { where: { email: "david.singh@example.com" } },
      ["id"]
    );

    if (!mikeUserId || !sarahUserId || !alexUserId || !davidUserId) {
      console.warn("❌ Required driver users not found, skipping driver seeder");
      return;
    }

    // ✅ Insert drivers
    await queryInterface.bulkInsert("drivers", [
      {
        user_id: mikeUserId,
        license_number: "DL1420110012345",
        license_expiry: new Date("2027-12-31"),
        driver_license_path: "uploads/licenses/mike_license.pdf",
        is_verified: true,
        is_online: true,
        is_available: true,
        current_location: JSON.stringify({
          latitude: 28.6139,
          longitude: 77.209,
          accuracy: 5.0,
          heading: 45.5,
          speed: 0.0,
          timestamp: new Date().toISOString(),
        }),
        total_rides: 1247,
        total_earnings: 186420.75,
        average_rating: 4.7,
        documents_verified: true,
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        updated_at: new Date(),
      },
      {
        user_id: sarahUserId,
        license_number: "DL1420110012346",
        license_expiry: new Date("2026-08-15"),
        driver_license_path: "uploads/licenses/sarah_license.pdf",
        is_verified: true,
        is_online: false,
        is_available: false,
        current_location: JSON.stringify({
          latitude: 28.5355,
          longitude: 77.391,
          accuracy: 8.0,
          heading: 180.0,
          speed: 0.0,
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        }),
        total_rides: 892,
        total_earnings: 134560.25,
        average_rating: 4.9,
        documents_verified: true,
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        updated_at: new Date(),
      },
      {
        user_id: alexUserId,
        license_number: "DL1420110012347",
        license_expiry: new Date("2025-03-20"),
        driver_license_path: "uploads/licenses/alex_license.pdf",
        is_verified: false,
        is_online: false,
        is_available: false,
        current_location: null,
        total_rides: 0,
        total_earnings: 0.0,
        average_rating: 5.0,
        documents_verified: false,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updated_at: new Date(),
      },
      {
        user_id: davidUserId,
        license_number: "DL1420110012348",
        license_expiry: new Date("2028-11-10"),
        driver_license_path: "uploads/licenses/david_license.pdf",
        is_verified: true,
        is_online: false,
        is_available: false,
        current_location: JSON.stringify({
          latitude: 28.7041,
          longitude: 77.1025,
          accuracy: 10.0,
          heading: 270.0,
          speed: 0.0,
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        total_rides: 567,
        total_earnings: 89340.5,
        average_rating: 4.4,
        documents_verified: true,
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("drivers", null, {});
  },
};
