const dotenv = require("dotenv");
dotenv.config();

const Sequelize = require("sequelize");
const connection = new Sequelize(
	"reactnative",
	"reactnative",
	`${process.env.MYSQL_PASSWORD}`,
	{
		host: "127.0.0.1",
		port: 3306,
		dialect: "mysql",
		timezone: "-03:00",
	}
);

module.exports = connection;
