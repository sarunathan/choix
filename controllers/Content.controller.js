const { successResponse } = require("../helpers/methods")
const db = require('../models/index');
const Sequelize = require('sequelize');


/**
 * Onboard Content Via Post call
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
 exports.contentOnboard = async (req, res) => {
    if(req.body.expiry) {
        var theDate = new Date();
        var myNewDate = new Date(theDate);
        myNewDate.setDate(myNewDate.getDate() + req.body.expiry);
        req.body.expiry = myNewDate;
    }
    let sqlQuery = "SELECT contentId FROM contents where title='"+req.body.title+"' AND status=1";
    [results, metadata] = await db.sequelize.query(sqlQuery);

    if(!results[0]) {
        db.content.create({
            ...req.body,
            ...{
                voteCount : 0,
                upvote: 0,
                downvote: 0,
                status: 1
            },
        })
        .then(data =>{
            res.send(
                data
            )
        });
    }else {
        res.send(
            {
                err : "Already the content is added, Probably it would been voted by you already"
            }
        )
    }
}

/**
 * Get Content Via GET call
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
 exports.getContent = async (req, res) => {
    const pageNo = req.query.pageNo || 0;
    // let offset = pageNo === 0 ? 0 : req.query.pageNo * 10;
    const limit = 10;
    var results, metadata;

    
    let sqlQuery;
    let lastContentId = req.query.lastContentId || 0;
    if(!!req.query.search) {
        sqlQuery = "SELECT contentId,ott,genre,title,image FROM contents where title LIKE '%"+req.query.search+"%'  AND status = 1 AND contentId > "+lastContentId+"  AND contentId NOT IN ( select contentId from usercontents where ( hasUpvoted = 1 OR hasDownvoted=1 ) AND userId = "+req.query.userId +") ORDER BY contentId ASC LIMIT "+limit;
    }else {
        sqlQuery = "SELECT contentId,ott,genre,title,image FROM contents where status = 1 AND contentId > "+lastContentId+" AND contentId NOT IN ( select contentId from usercontents where (hasUpvoted = 1 OR hasDownvoted=1) AND userId = "+req.query.userId +") ORDER BY contentId ASC LIMIT "+limit;
    }

    [results, metadata] = await db.sequelize.query(sqlQuery);
    
    console.log("results", results);
    res.send(results);
    
    
}


/**
 * Vote Content Via POST call
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
 exports.vote = async (req, res) => {
     let voteQuery = {};

    let updateUserState = () => {
        db.user.findOne(
            {
                "where" : {
                    "userId": req.body.userId
                }
            }
        )
        .then(async (user) =>{
            const index = user.dataValues.contributionIndex;
            let updateQuery = {   
                "contributionIndex" : db.sequelize.literal('contributionIndex + 1')
            };
            if((index+1)%3 == 0) {
                updateQuery["remainingSuggestion"] = db.sequelize.literal('remainingSuggestion + 1');
            }

            user.update(updateQuery)
            .then(()=>{
                res.send({});
            })
            
        })
    } 

    if(req.body.vote == "UPVOTE" || req.body.vote == "DOWNVOTE") {
        if(req.body.vote == "UPVOTE") {
            voteQuery["upvote"] = db.sequelize.literal('upvote + 1');
            voteQuery["voteCount"] = db.sequelize.literal('voteCount + 1')
        }else {
            voteQuery["downvote"] = db.sequelize.literal('downvote + 1');
            voteQuery["voteCount"] = db.sequelize.literal('voteCount - 1')
        }
        db.content.findOne(
            {
                "where" : {
                    "contentId": req.body.contentId,
                }
            }
        )
        .then(async (content)=>{
            content.update(voteQuery)
            .then(()=>{
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
                            "hasWatchlisted": 0,
                            "hasSuggested": 0,
                            "hasUpvoted": req.body.vote == "UPVOTE"? 1 : 0,
                            "hasDownvoted": req.body.vote == "DOWNVOTE"? 1 : 0
                        })
                        .then(data =>{
                            updateUserState();
                        })
                    }else {
                        db.usercontent.create({
                                "userId": req.body.userId,
                                "contentId": req.body.contentId,
                                "hasWatchlisted": 1,
                                "hasSuggested": 0,
                                "hasUpvoted": req.body.vote == "UPVOTE"? 1 : 0,
                                "hasDownvoted": req.body.vote == "DOWNVOTE"? 1 : 0
                            })
                            .then(data =>{
                                updateUserState();
                            })
                    }
                })
            })
        })
        
    }else {
        res.send({
            "err": "Invalid vote"
        })
    }

    
}
