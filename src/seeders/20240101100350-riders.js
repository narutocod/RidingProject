/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ✅ Check if riders already exist
    const existingRidersCount = await queryInterface.rawSelect(
      "riders",
      {},
      ["id"]
    );

    if (existingRidersCount) {
      return;
    }

    // ✅ Get user IDs for riders (assuming users are seeded first)
    const johnUserId = await queryInterface.rawSelect(
      "users",
      { where: { email: "john.rider@example.com" } },
      ["id"]
    );

    const janeUserId = await queryInterface.rawSelect(
      "users",
      { where: { email: "jane.smith@example.com" } },
      ["id"]
    );

    const robertUserId = await queryInterface.rawSelect(
      "users",
      { where: { email: "robert.j@example.com" } },
      ["id"]
    );

    // ✅ Skip if any rider user is missing
    if (!johnUserId || !janeUserId || !robertUserId) {
      console.warn("❌ Some rider users not found. Make sure users seeder runs first.");
      return;
    }

    // ✅ Insert riders linked to correct user_id
    await queryInterface.bulkInsert("riders", [
      {
        user_id: johnUserId,
        home_location: JSON.stringify({
          latitude: 28.6139,
          longitude: 77.209,
          address: "Connaught Place, New Delhi, Delhi 110001",
        }),
        work_location: JSON.stringify({
          latitude: 28.5355,
          longitude: 77.391,
          address: "Sector 62, Noida, Uttar Pradesh 201309",
        }),
        emergency_contact: JSON.stringify({
          name: "Mary Rider",
          phone: "+919876543299",
          relation: "wife",
        }),
        total_rides: 23,
        average_rating: 4.6,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updated_at: new Date(),
      },
      {
        user_id: janeUserId,
        home_location: JSON.stringify({
          latitude: 28.7041,
          longitude: 77.1025,
          address: "Rohini, Delhi 110085",
        }),
        work_location: JSON.stringify({
          latitude: 28.4595,
          longitude: 77.0266,
          address: "Cyber City, Gurugram, Haryana 122002",
        }),
        emergency_contact: JSON.stringify({
          name: "Tom Smith",
          phone: "+919876543298",
          relation: "brother",
        }),
        total_rides: 45,
        average_rating: 4.8,
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        updated_at: new Date(),
      },
      {
        user_id: robertUserId,
        home_location: JSON.stringify({
          latitude: 28.5494,
          longitude: 77.25,
          address: "Lajpat Nagar, New Delhi, Delhi 110024",
        }),
        work_location: null,
        emergency_contact: JSON.stringify({
          name: "Lisa Johnson",
          phone: "+919876543297",
          relation: "sister",
        }),
        total_rides: 3,
        average_rating: 5.0,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("riders", null, {});
  },
};
