'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('auctions', 'winnerId', {
      type: Sequelize.UUID,
      allowNull: true,
    });
    await queryInterface.addColumn('auctions', 'finalPrice', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('auctions', 'winnerId');
    await queryInterface.removeColumn('auctions', 'finalPrice');
  }
};
