/* eslint-disable @typescript-eslint/no-explicit-any */

import AppError from "../../errorHelpers/appError";
import { Booking } from "../booking/booking.model";
import { Guide } from "../guide/guide.model";
import { Tour } from "../tour/tour.model";
import { Review } from "./review.model";


// const createTourReview = async (user: any, payload: any) => {
//   const booking = await Booking.findOne({
//     _id: payload.booking,
//     user: user.userId,
//     status: "COMPLETE",
//   });

//   if (!booking) throw new AppError(400, "You cannot review this tour");

//   const exists = await Review.findOne({
//     booking: payload.booking,
//     user: user.userId,
//     tour: payload.tour,
//   });

//   if (exists) throw new AppError(400, "Already reviewed this tour");

//   return await Review.create({
//     user: user.userId,
//     targetType: "TOUR",
//     ...payload,
//   });
// };


// const createGuideReview = async (user: any, payload: any) => {
//   const booking = await Booking.findOne({
//     _id: payload.booking,
//     user: user.userId,
//     status: "COMPLETE",
//   });

//   if (!booking) throw new AppError(400, "You cannot review this guide");

//   const exists = await Review.findOne({
//     booking: payload.booking,
//     user: user.userId,
//     guide: payload.guide,
//   });

//   if (exists) throw new AppError(400, "Already reviewed this guide");

//   return await Review.create({
//     user: user.userId,
//     targetType: "GUIDE",
//     ...payload,
//   });
// };


const createTourReview = async (user: any, payload: any) => {
  // 1️⃣ Check booking validity
  const booking = await Booking.findOne({
    _id: payload.booking,
    user: user.userId,
    status: "COMPLETE",
  });

  if (!booking) throw new AppError(400, "You cannot review this tour");

  // 2️⃣ Prevent duplicate review
  const exists = await Review.findOne({
    booking: payload.booking,
    user: user.userId,
    tour: payload.tour,
  });

  if (exists) throw new AppError(400, "Already reviewed this tour");

  // 3️⃣ Create review
  const review = await Review.create({
    user: user.userId,
    targetType: "TOUR",
    ...payload,
  });

  // ⭐ 4️⃣ UPDATE TOUR RATING & COUNT
  const tourReviews = await Review.find({ tour: payload.tour });
  const avgRating =
    tourReviews.reduce((sum, r) => sum + r.rating, 0) / tourReviews.length;

  await Tour.findByIdAndUpdate(payload.tour, {
    averageRating: avgRating,
    totalReviews: tourReviews.length,
  });

  return review;
};


const createGuideReview = async (user: any, payload: any) => {
  // 1️⃣ Check booking validity
  const booking = await Booking.findOne({
    _id: payload.booking,
    user: user.userId,
    status: "COMPLETE",
  });

  if (!booking) throw new AppError(400, "You cannot review this guide");

  // 2️⃣ Prevent duplicate review
  const exists = await Review.findOne({
    booking: payload.booking,
    user: user.userId,
    guide: payload.guide,
  });

  if (exists) throw new AppError(400, "Already reviewed this guide");

  // 3️⃣ Create review
  const review = await Review.create({
    user: user.userId,
    targetType: "GUIDE",
    ...payload,
  });
  

  // ⭐ 4️⃣ UPDATE GUIDE RATING & COUNT
  const guideReviews = await Review.find({ guide: payload.guide });
  const avgRating =
    guideReviews.reduce((sum, r) => sum + r.rating, 0) /
    guideReviews.length;

  await Guide.findByIdAndUpdate(payload.guide, {
    averageRating: avgRating,
    totalReviews: guideReviews.length,
  });

  return review;
};


const getAllGuideReviews = async (query: any) => {
  const filter: any = {};
  if (query.guide) filter.guide = query.guide;
  if (query.rating) filter.rating = query.rating;

  return await Review.find(filter).populate("user", "name");
};

const getAllTourReviews = async (query: any) => {
  const filter: any = {};
  if (query.tour) filter.tour = query.tour;
  if (query.rating) filter.rating = query.rating;

  return await Review.find(filter).populate("user", "name");
};




export const ReviewService = {
  createTourReview,
  getAllTourReviews,
  createGuideReview,
  getAllGuideReviews
};
