import User from "../../models/user.model.js";

export async function updateRatings(winnerSocket, loserSocket) {
  const [updatedWinner, updatedLoser] = await Promise.all([
    User.findOneAndUpdate({ username: winnerSocket.username }, { $inc: { rating: 8 } }, { new: true }),
    User.findOneAndUpdate({ username: loserSocket.username }, { $inc: { rating: -8 } }, { new: true }),
  ]);

  winnerSocket.rating = updatedWinner.rating;
  loserSocket.rating = updatedLoser.rating;
}

export async function fetchUserRatings(username1, username2) {
  const [p1, p2] = await Promise.all([
    User.findOne({ username: username1 }),
    User.findOne({ username: username2 }),
  ]);
  return [p1.rating, p2.rating];
}
