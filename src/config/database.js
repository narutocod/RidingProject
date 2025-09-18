const { Sequelize } = require('sequelize');
const Umzug = require('umzug');
const path = require('path');
const logger = require('../utils/logger');
require('dotenv').config();

class PostgresConnection {
  constructor() {
    this.dbName = process.env.DB_NAME_BACKEND || 'SmartCityLighting';
    this.dialect = process.env.DIALECT || 'postgres';
    this.user = process.env.DB_USER || 'postgres';
    this.password = process.env.DB_PASS || 'rgbXYZ9182';
    this.host = process.env.DB_HOST || 'localhost';
    this.minPool = 1;
    this.maxPool = 20;
    this.database = null;
    this.createInstance();
  }

  createInstance = async () => {
    try {
      this.database = new Sequelize(this.dbName, this.user, this.password, {
        host: this.host,
        dialect: this.dialect,
        port: 5432,
        logging: false,
        pool: {
          max: this.maxPool || 100,
          min: this.minPool || 1,
          acquire: 10000,
          idle: 5000,
          evict: 10000,
        }
      });
      await this.connect();
      return true;
    } catch (err) {
      logger.error("Error in creating database instance", err);
      return false;
    }
  }

  connect = async () => {
    try {
      await this.database.authenticate();
      logger.info("Connection to database has been established successfully");
      await this.runMigrationsAndSeeders();
      return true;
    } catch (error) {
      logger.error('Error occurred while connecting to database.', error);
      throw error;
    }
  };

  runMigrationsAndSeeders = async () => {
    try {
      await this.migrate().up();
      await this.seed().up();
      logger.info(`Migrations and seeders executed`);
    } catch (error) {
      logger.error(`Error running migrations and seeders`, error);
    }
  }

  migrate = () => new Umzug({
    migrations: {
      path: path.join(__dirname, '../migrations'),
      pattern: /\.js$/,
      params: [this.database.getQueryInterface(), Sequelize],
    },
    storage: 'sequelize',
    storageOptions: {
      sequelize: this.database,
    },
  });

  seed = () => new Umzug({
    migrations: {
      path: path.join(__dirname, '../seeders'),
      pattern: /\.js$/,
      params: [this.database.getQueryInterface(), Sequelize],
    },
    storage: 'sequelize',
    storageOptions: {
      sequelize: this.database,
    },
  });
}

module.exports = new PostgresConnection();
