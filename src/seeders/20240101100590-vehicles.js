/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if vehicles already exist
    const existingVehiclesCount = await queryInterface.rawSelect(
      'vehicles',
      {},
      ['COUNT(*) as count']
    );

    if (existingVehiclesCount && existingVehiclesCount.count > 0) {
      return;
    }

    // Get driver IDs by checking drivers table
    const drivers = await queryInterface.sequelize.query(
      `SELECT d.id, u.email 
       FROM drivers d 
       JOIN users u ON d.user_id = u.id 
       ORDER BY d.id`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (drivers.length === 0) {
      return;
    }

    const vehicleData = [];

    for (const driver of drivers) {
      let vehicleInfo = {};

      switch (driver.email) {
        case 'mike.driver@example.com':
          vehicleInfo = [
            {
              driver_id: driver.id,
              vehicle_type: 'car',
              vehicle_number: 'DL01AB1234',
              vehicle_brand: 'Maruti Suzuki',
              vehicle_model: 'Swift Dzire',
              vehicle_color: 'Pearl White',
              manufacturing_year: 2021,
              registration_path: 'uploads/registrations/mike_registration.pdf',
              insurance_path: 'uploads/insurance/mike_insurance.pdf',
              registration_expiry: new Date('2031-12-15'),
              insurance_expiry: new Date('2025-12-15'),
              is_verified: true,
              is_active: true,
              seating_capacity: 4
            },
            {
              driver_id: driver.id,
              vehicle_type: 'car',
              vehicle_number: 'DL05IJ7890',
              vehicle_brand: 'Tata',
              vehicle_model: 'Nexon',
              vehicle_color: 'Dark Grey',
              manufacturing_year: 2023,
              registration_path: 'uploads/registrations/mike_nexon_registration.pdf',
              insurance_path: 'uploads/insurance/mike_nexon_insurance.pdf',
              registration_expiry: new Date('2038-06-30'),
              insurance_expiry: new Date('2025-06-30'),
              is_verified: true,
              is_active: false,
              seating_capacity: 4
            }
          ];
          break;
        case 'sarah.wilson@example.com':
          vehicleInfo = [
            {
              driver_id: driver.id,
              vehicle_type: 'car',
              vehicle_number: 'DL02CD5678',
              vehicle_brand: 'Hyundai',
              vehicle_model: 'Grand i10 NIOS',
              vehicle_color: 'Metallic Blue',
              manufacturing_year: 2022,
              registration_path: 'uploads/registrations/sarah_registration.pdf',
              insurance_path: 'uploads/insurance/sarah_insurance.pdf',
              registration_expiry: new Date('2032-08-20'),
              insurance_expiry: new Date('2025-08-20'),
              is_verified: true,
              is_active: true,
              seating_capacity: 4
            }
          ];
          break;
        case 'alex.kumar@example.com':
          vehicleInfo = [
            {
              driver_id: driver.id,
              vehicle_type: 'bike',
              vehicle_number: 'DL03EF9012',
              vehicle_brand: 'Honda',
              vehicle_model: 'Activa 6G',
              vehicle_color: 'Matte Red',
              manufacturing_year: 2023,
              registration_path: 'uploads/registrations/alex_registration.pdf',
              insurance_path: 'uploads/insurance/alex_insurance.pdf',
              registration_expiry: new Date('2038-03-25'),
              insurance_expiry: new Date('2025-03-25'),
              is_verified: false,
              is_active: true,
              seating_capacity: 1
            }
          ];
          break;
        case 'david.singh@example.com':
          vehicleInfo = [
            {
              driver_id: driver.id,
              vehicle_type: 'auto',
              vehicle_number: 'DL04GH3456',
              vehicle_brand: 'Bajaj',
              vehicle_model: 'RE Compact',
              vehicle_color: 'Yellow Green',
              manufacturing_year: 2020,
              registration_path: 'uploads/registrations/david_registration.pdf',
              insurance_path: 'uploads/insurance/david_insurance.pdf',
              registration_expiry: new Date('2030-11-12'),
              insurance_expiry: new Date('2024-11-12'),
              is_verified: true,
              is_active: false,
              seating_capacity: 3
            }
          ];
          break;
        default:
          vehicleInfo = [];
      }

      // Add timestamps to each vehicle
      vehicleInfo.forEach(vehicle => {
        vehicle.created_at = new Date();
        vehicle.updated_at = new Date();
      });

      vehicleData.push(...vehicleInfo);
    }

    if (vehicleData.length > 0) {
      await queryInterface.bulkInsert('vehicles', vehicleData, {});
      console.log('✅ Demo vehicles seeded successfully');
    } else {
      console.log('No vehicle data to seed');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('vehicles', null, {});
  }
};
