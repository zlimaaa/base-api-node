module.exports = {
  dialect: 'postgres',
  host: 'localhost',
  username: 'postgres',
  password: 'docker',
  database: 'projeto',
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
};
