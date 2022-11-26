'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}


const DataTypes = Sequelize.DataTypes;

/// Define Content

db['content'] = sequelize.define('content', {
  contentId: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  title: DataTypes.STRING,
  upvote: DataTypes.INTEGER,
  downvote: DataTypes.INTEGER,
  voteCount: DataTypes.INTEGER,
  genre: DataTypes.STRING,
  expiry: DataTypes.DATE,
  status: DataTypes.BOOLEAN,
  ott: DataTypes.STRING,
  image: DataTypes.STRING
})


/// Define User

db['user'] = sequelize.define('user', {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    unique: false
  },
  deviceId: {
    type: DataTypes.STRING,
    unique: false
  },
  remainingSuggestion: {
    type: DataTypes.INTEGER,
    unique: false
  },
  contributionIndex: {
    type: DataTypes.INTEGER,
    unique: false
  },
})


// user content
db['usercontent'] = sequelize.define('usercontent', {
  contentInteractionId: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    unique: false
  },
  contentId: {
    type: DataTypes.INTEGER,
    unique: false
  },
  hasSuggested: {
    type: DataTypes.BOOLEAN,
    unique: false
  },
  hasUpvoted: {
    type: DataTypes.BOOLEAN,
    unique: false
  },
  hasDownvoted: {
    type: DataTypes.BOOLEAN,
    unique: false
  },
  hasWatchlisted: {
    type: DataTypes.BOOLEAN,
    unique: false
  }
})

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
