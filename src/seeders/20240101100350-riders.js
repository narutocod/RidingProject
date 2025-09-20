/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get user IDs for riders (assuming users are seeded first)
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

    if (!johnUserId && !janeUserId && !robertUserId) {
      console.warn("❌ No rider users found. Make sure users seeder runs first.");
      return;
    }

    const ridersToInsert = [];

    // Only insert if this user doesn't already have a rider row
    const johnExists = johnUserId ? await queryInterface.rawSelect(
      "riders",
      { where: { user_id: johnUserId } },
      ["id"]
    ) : null;

    if (johnUserId && !johnExists) {
      ridersToInsert.push({
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
      });
    }

    const janeExists = janeUserId ? await queryInterface.rawSelect(
      "riders",
      { where: { user_id: janeUserId } },
      ["id"]
    ) : null;

    if (janeUserId && !janeExists) {
      ridersToInsert.push({
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
      });
    }

    const robertExists = robertUserId ? await queryInterface.rawSelect(
      "riders",
      { where: { user_id: robertUserId } },
      ["id"]
    ) : null;

    if (robertUserId && !robertExists) {
      ridersToInsert.push({
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
      });
    }

    // Insert only if there are new riders
    if (ridersToInsert.length > 0) {
      await queryInterface.bulkInsert("riders", ridersToInsert);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("riders", null, {});
  },
};
