// const secrets = require("../secrets");

// const Twitter = require("Twitter");


// var twitterClient = new Twitter({
//   consumer_key: secrets.twitter.consumer_key,
//   consumer_secret: secrets.twitter.consumer_secret,
//   access_token_key: secrets.twitter.access_token_key,
//   access_token_secret: secrets.twitter.access_token_secret,
// });

// module.exports = async (client) => {
//   const broadcaster = await require("../broadcaster");

//   client
//       .command("tweet")
//       .alias("tweetbeastie")
//       .description("Tweets on command!")
//       .clearance("broadcaster")
//       .action(async () => {
//         twitterClient.post('statuses/update', {status: 'BeastieBot is tweeting successfully! rawr'},  function(error, tweet, response) {
//           if(error) throw error;
//           console.log(tweet);  // Tweet body.
//           console.log(response);  // Raw response object.
//         });
//       })
