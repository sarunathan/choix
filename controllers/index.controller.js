const { successResponse } = require("../helpers/methods")
const db = require('../models/index');
const Sequelize = require('sequelize');


/**
 * Onboard User on post call
 * @param req
 * @param res
 * @returns {Promise<void>}
 */

 exports.userOnboard = async (req, res) => {
    console.log("Making API call", req.body.deviceId);
    db.user.findOne(
        {
            "where" : {
                "deviceId": req.body.deviceId
            }
        }
    )
    .then(user =>{
        if(user != null ){
            console.log("Found existing user", user.dataValues.userId);
            res.send({
                "userId": user.dataValues.userId
            })
        }else {
            db.user.create({
                    "deviceId": req.body.deviceId,
                    "remainingSuggestion": 2,
                    "contributionIndex": 0
                })
                .then(data =>{
                    console.log("new user inserted", data);
                    db.user.findOne(
                        {
                            "where" : {
                                "deviceId": req.body.deviceId
                            }
                        }
                    )
                    .then(user =>{
                        console.log("Added new user", user.dataValues.userId);
                        res.send({
                            "userId": user.dataValues.userId
                        })
                    });
                })
                .catch(err => {
                    console.log(err);
                    res.send({"err": "something went wrong"});
                })
        }
    })
    .catch((err) => {
        console.log("Err in user onboarding", err);
    });
}



/**
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */

exports.getSuggestion = async (req, res) => {
    const isNext = !!req.query.next;
    db.user.findOne(
        {
            "where" : {
                "userId": req.query.userId
            }
        }
    )
    .then(async (user) =>{
        console.log("userinfo",user);
        if(user != null ){           
            
            if(user.dataValues.remainingSuggestion <= 0 && isNext) {
                res.send({
                    "err": "limit exceeded"
                })
            }else {

                const [results, metadata] = await db.sequelize.query("SELECT * FROM contents where status=1 AND contentId NOT IN ( select contentId from usercontents where hasSuggested = 1 AND userId = "+req.query.userId +") ORDER BY voteCount DESC" );
                console.log("results", results);
                if(!results[0]) {
                    res.send([]);
                    return;
                }

                if(!isNext) {
                    // Return with current suggestion , untill asked for next suggestion
                    res.send(results[0]);
                    return;
                }

                if(!results[0]){
                    // All suggestions are done
                    res.send({"err": 100});
                    return;
                }

                db.usercontent.findOne(
                    {
                        "where" : {
                            "userId": req.query.userId,
                            "contentId": results[0].contentId,
                        }
                    }
                )
                .then(async (usercontent) => {
                    
                    // Update remaining count
                    user.update({
                        "remainingSuggestion" : db.sequelize.literal('remainingSuggestion - 1')
                    })
                    .then(()=>{

                        if(usercontent != null ){
                            usercontent.update({
                                "hasSuggested": 1
                            })
                            .then(async (data) =>{
                                const [updatedResult, metadata] = await db.sequelize.query("SELECT * FROM contents where status=1 AND contentId NOT IN ( select contentId from usercontents where hasSuggested = 1 AND userId = "+req.query.userId +") ORDER BY voteCount DESC" );
                                console.log("results", updatedResult);
                                if(updatedResult[0]) {
                                    res.send(updatedResult[0]);
                                }else{
                                    res.send({});
                                }
                                
                            })
                        }else {
                            db.usercontent.create({
                                "userId": req.query.userId,
                                "contentId": results[0].contentId,
                                "hasWatchlisted": 0,
                                "hasSuggested": 1,
                                "hasUpvoted": 0,
                                "hasDownvoted": 0,
                            })
                            .then(async (data) =>{
                                const [updatedResult, metadata] = await db.sequelize.query("SELECT * FROM contents where status=1 AND contentId NOT IN ( select contentId from usercontents where hasSuggested = 1 AND userId = "+req.query.userId +") ORDER BY voteCount DESC" );
                                console.log("results", results);
                                if(updatedResult[0]) {
                                    res.send(updatedResult[0]);
                                    return;
                                }else {
                                    res.send({});
                                }
                            })
                        }

                    })

                })
            }
            

        }else {
            res.send({
                "err": "limit exceeded"
            })
        }
    })
}


/**
 * Get Suggestion Count
 * @param req
 * @param res
 * @returns {Promise<void>}
 */

 exports.getSuggestionCount = async (req, res) => {
    const isNext = !!req.query.next;
    db.user.findOne(
        {
            "where" : {
                "userId": req.query.userId
            }
        }
    )
    .then(async (user) =>{
        console.log("userinfo",user);
        if(user != null ){           
            const suggestion = user.dataValues.remainingSuggestion;
            const contributionIndex = user.dataValues.contributionIndex;
            res.send({
                suggestion,
                contributionIndex
            })
        }else {
            res.send({
                "err": "Invalid user"
            })
        }
    })
}



/**
 * Get user watch
 * @param req
 * @param res
 * @returns {Promise<void>}
 */

 exports.getWatchlist = async (req, res) => {
    const pageNo = req.query.pageNo || 0;
    const offset = pageNo === 0 ? 0 : req.query.pageNo * 10;
    const limit = 10;
    // const [results, metadata] = await db.sequelize.query("select * from contents where contentId = ( select contentId from usercontents where hasWatchlisted = 1 AND status = 1 AND userId = "+req.query.userId+" LIMIT "+limit+" OFFSET "+offset+" )");
    const [results, metadata] = await db.sequelize.query("select * from contents LEFT JOIN usercontents ON contents.contentId = usercontents.contentId AND usercontents.hasWatchlisted = 1 AND usercontents.userId = "+req.query.userId +" LIMIT "+limit+" OFFSET "+offset);
    console.log("results", results);
    res.send(results);
}


/**
 * Add user watchlist
 * @param req
 * @param res
 * @returns {Promise<void>}
 */

 exports.userWatchlist = async (req, res) => {
    db.usercontent.findOne(
        {
            "where" : {
                "userId": req.body.userId,
                "contentId": req.body.contentId,
            }
        }
    )
    .then(usercontent => {
        if(usercontent != null ){
            usercontent.update({
                "hasWatchlisted": 1,
                "hasSuggested": 0,
                "hasUpvoted": 0,
                "hasDownvoted": 0,
            })
            .then(data =>{
                res.send({});
            })
        }else {
            db.usercontent.create({
                    "userId": req.body.userId,
                    "contentId": req.body.contentId,
                    "hasWatchlisted": 1,
                    "hasSuggested": 0,
                    "hasUpvoted": 0,
                    "hasDownvoted": 0,
                })
                .then(data =>{
                    res.send({});
                })
        }
    })
   
}

