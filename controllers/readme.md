Content onboard
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{
  "title": "Hello world",
  "upvote": 60,
  "downvote": 40,
  "voteCount": 100,
  "genre": "SCIFI",
  "expiry": 30,
  "status": 0,
  "ott": "hotstar"
  }' \
  http://localhost:5000/content/onboard


Get Contents
http://localhost:5000/content?pageNo=0&userId=11&search=hello


vote Content
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{
  "contentId": "5",
  "vote": "DOWNVOTE",
  "userId": "1"
  }' \
  http://localhost:5000/content/vote


User onboard
   curl --header "Content-Type: application/json" \
  --request POST \
  --data '{
      "deviceId": "12311"
    }' \
  http://localhost:5000/user/onboard



Get user Suggestion
http://localhost:5000/user/suggestion?userId=1


Get user next Suggestion
http://localhost:5000/user/suggestion?userId=1&next=true





