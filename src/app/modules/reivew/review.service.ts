/* eslint-disable @typescript-eslint/no-explicit-any */

import AppError from "../../errorHelpers/appError";
import { QueryBuilder } from "../../utils/queryBuilder";
import { Booking } from "../booking/booking.model";
import { Guide } from "../guide/guide.model";
import { Tour } from "../tour/tour.model";
import { Review } from "./review.model";



const createTourReview = async (user: any, payload: any) => {
  // Check booking validity
  const booking = await Booking.findOne({
    _id: payload.booking,
    user: user.userId,
    status: "COMPLETE",
  });

  if (!booking) throw new AppError(400, "You cannot review this tour");

  // Prevent duplicate review
  const exists = await Review.findOne({
    booking: payload.booking,
    user: user.userId,
    tour: payload.tour,
  });

  if (exists) throw new AppError(400, "Already reviewed this tour");

  //  Create review
  const review = await Review.create({
    user: user.userId,
    targetType: "TOUR",
    ...payload,
  });

  //UPDATE TOUR RATING & COUNT
  const tourReviews = await Review.find({ tour: payload.tour });
  const avgRating =
    tourReviews.reduce((sum, r) => sum + r.rating, 0) / tourReviews.length;

  await Tour.findByIdAndUpdate(payload.tour, {
    averageRating: avgRating,
    totalReviews: tourReviews.length,
  });

  
  await Booking.findByIdAndUpdate(
    payload.booking,
    { hasReview: true },
    { runValidators: true }
  );

  return review;
};



const createGuideReview = async (user: any, payload: any) => {
  
  const booking = await Booking.findOne({
    _id: payload.booking,
    user: user.userId,
    status: "COMPLETE",
  });

  if (!booking) throw new AppError(400, "You cannot review this guide");

  
  const exists = await Review.findOne({
    booking: payload.booking,
    user: user.userId,
    guide: payload.guide,
  });

  if (exists) throw new AppError(400, "Already reviewed this guide");

  
  const review = await Review.create({
    user: user.userId,
    targetType: "GUIDE",
    ...payload,
  });


  
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


const getAllGuideReviews = async (query: Record<string, string>) => {

  
  const baseQuery = Review.find({ targetType: "GUIDE" })
    .populate("user", "name email")
    .populate("guide", "user"); 

  const queryBuilder = new QueryBuilder(baseQuery, query);

 
  const reviewsQuery = queryBuilder
    // .search(reviewSearchableFields)
    .filter() 
    .sort()
    .fields()
    .paginate();

  
  const [data, meta] = await Promise.all([
    reviewsQuery.build(),
    queryBuilder.getMeta()
  ]);

  
  return {
    data,
    meta
  };
};


const getAllTourReviews = async (query: Record<string, string>) => {

    
    const baseQuery = Review.find({ targetType: "TOUR" }) 
        .populate("user", "name email")
        .populate("tour", "title slug"); 

    const queryBuilder = new QueryBuilder(baseQuery, query);

    
    const reviewsQuery = queryBuilder
        // .search(reviewSearchableFields) 
        .filter() 
        .sort()
        .fields()
        .paginate();

    
    const [data, meta] = await Promise.all([
        reviewsQuery.build(),
        queryBuilder.getMeta()
    ]);
    
   
    return {
        data,
        meta
    };
};



export const ReviewService = {
  createTourReview,
  getAllTourReviews,
  createGuideReview,
  getAllGuideReviews
};
