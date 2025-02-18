const Users = require("../models/user");

// read all documents from db
const readFromDb = async ({ key, value, collection = undefined }) => {
  console.log("read from db");
  if (key != undefined && value != undefined) {
    return await collection.findOne({ [key]: value });
  } else {
    return await collection.find().lean();
  }
};

// helps to write to db. Upsert helps with adding if not found, or update if found.
const writeToDb = async ({
  collection = undefined,
  userid,
  username,
  firstname,
  lastname,
  location,
  age,
  email,
  linkssocial,
  linksprojects,
  userdescription,
  userswipes,
  recommendqueue,
  imageprofile,
}) => {
  console.log("write to db");
  const query = { userid };
  const updatedat = Date.now();
  const update = {
    $set: {
      userid,
      username,
      firstname,
      lastname,
      location,
      age,
      email,
      linkssocial,
      linksprojects,
      userdescription,
      userswipes,
      recommendqueue,
      imageprofile,
    },
    updatedat,
  };

  return await collection.findOneAndUpdate(query, update, { upsert: true });
};

const deleteFromDb = async ({ userid, collection = undefined }) => {
  console.log(`delete ${userid} from db`);
  const query = { userid: userid };
  return await collection.findOneAndDelete(query);
};

const getRandomUsers = async (count, swipedQueuedUsers, userid) => {
  const combinedUsers = [...swipedQueuedUsers, userid];
  // console.log("combinedUsers", combinedUsers);
  return await Users.aggregate([
    { $match: { userid: { $nin: combinedUsers } } },
    { $sample: { size: count } },
  ]);
};

const getSwipedUsers = async (userdata) => {
  return Object.keys(userdata.userswipes);
};
const getRecommendations = async ({ userid, count }) => {
  console.log("useridcount", userid, count);
  const data = await readFromDb({
    key: "userid",
    value: userid,
    collection: Users,
  });
  const swipedUsers = await getSwipedUsers(data);
  const randomUsers = await getRandomUsers(
    count,
    [...swipedUsers, ...data.recommendqueue],
    userid
  );
  const listOfUsers = randomUsers.map((user) => user.userid);
  data.recommendqueue.push(...listOfUsers);
  // data.recommendqueue = [];
  const write = await writeToDb({
    userid,
    recommendqueue: data.recommendqueue,
    collection: Users,
  });

  return { listOfUsers, write, data };
};

module.exports = {
  readFromDb,
  writeToDb,
  deleteFromDb,
  getRandomUsers,
  getSwipedUsers,
  getRecommendations,
};
