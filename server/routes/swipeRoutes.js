const express = require("express");
const router = express.Router();
const Users = require("../models/user");
const {
  readFromDb,
  writeToDb,
  deleteFromDb,
  getRandomUsers,
  getSwipedUsers,
  getRecommendations,
} = require("../helpers/dbhelpers");

router.post("/ismatch/:userid/:otherid", async (req, res) => {
  try {
    const userid = req.params.userid;
    const otherid = req.params.otherid;

    console.log("ismatch", userid, userid);

    const data = await readFromDb({
      key: "userid",
      value: userid,
      collection: Users,
    });
    let response = null;
    if (data.userswipes[otherid] !== undefined) {
      if (data.userswipes[otherid].swipe === "true") {
        response = true;
      } else if (data.userswipes[otherid].swipe === "false") {
        response = false;
      } else {
        res.status(400).send({
          message: `Something went wrong with user ${userid} and ${otherid} on /ismatch`,
          data: data,
          response: response,
        });
      }
      const write = await writeToDb({
        userid,
        userswipes: data.userswipes,
        collection: Users,
      });
      res.status(200).send({
        message: `User ${userid} has user ${otherid} with value ${data.userswipes[otherid]}`,
        data: write,
        response: response,
      });
    } else {
      res.status(404).send({
        message: `User ${userid} does not have ${otherid}`,
        data: data,
        response: null,
      });
    }
  } catch (err) {
    console.log(err);
  }
});

// app.get('/nextUser')
router.post("/nextuser/:userid", async (req, res) => {
  try {
    const userid = req.params.userid;
    let nextuser = 0;
    let write = null;

    const data = await readFromDb({
      key: "userid",
      value: userid,
      collection: Users,
    });

    if (data.recommendqueue.length > 0) {
      nextuser = data.recommendqueue.shift();
      write = await writeToDb({
        userid,
        recommendqueue: data.recommendqueue,
        collection: Users,
      });
    } else {
      //   nextuser = 0;
      //   write = null;
      //   get more users
    }

    res.status(200).send({
      message: `User ${userid}'s next user in queue is ${nextuser} and has ${data.recommendqueue.length} recommendations left`,
      data: write,
      response: nextuser,
    });
  } catch (err) {
    console.log(err);
  }
});
router.post("/recommendation/:userid/:count?", async (req, res) => {
  try {
    const userid = req.params.userid;
    const count = Number(req.params.count || 20);

    if (typeof count === "number") {
      const { listOfUsers, write, data } = await getRecommendations({
        userid,
        count,
      });

      res.status(200).send({
        message: `User ${userid} queue addition successful: added ${data.recommendqueue.length} recommendations`,
        data: write,
        added: listOfUsers,
      });
    } else {
      res.status(400).send({ message: "Bad request" });
    }
  } catch (err) {
    console.log(err);
  }
});

router.post("/:userid/:otherid/:bool", async (req, res) => {
  try {
    const bool = req.params.bool;
    const userid = req.params.userid;
    const otherid = req.params.otherid;

    console.log("swipe", userid, userid, bool, typeof bool);
    if (bool === "true" || bool === "false") {
      const data = await readFromDb({
        key: "userid",
        value: userid,
        collection: Users,
      });
      console.log("userswipes", data.userswipes);
      if (bool === "true") {
        data.userswipes[otherid] = {
          swipe: "true",
          time: new Date().toISOString(),
        };
      } else if (bool === "false") {
        data.userswipes[otherid] = {
          swipe: "false",
          time: new Date().toISOString(),
        };
      }
      const write = await writeToDb({
        userid,
        userswipes: data.userswipes,
        collection: Users,
      });

      res.status(200).send({
        message: `Swipe by ${userid} successful: ${bool} on ${otherid}`,
        data: write,
      });
    } else {
      res.status(400).send({ message: "Bad request" });
    }
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
