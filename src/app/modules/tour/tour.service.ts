
import { deleteImageFromCLoudinary } from "../../config/cloudinary.config";
import { QueryBuilder } from "../../utils/queryBuilder";
import { tourSearchableFields, tourTypesSearchableFields } from "./tour.constant";
import { ITour, ITourType } from "./tour.interface";
import { Tour, TourType } from "./tour.model";


//tour 

const createTour = async (payload: ITour) => {

  const existingTour = await Tour.findOne({ title: payload.title });
  if (existingTour) {
    throw new Error("A tour with this title already exists.");
  }

  const baseSlug = payload.title.toLowerCase().split(" ").join("-")
  let slug = `${baseSlug}`

  let counter = 0;
  while (await Tour.exists({ slug })) {
    slug = `${slug}-${counter++}` 
  }

  payload.slug = slug;

  const tour = await Tour.create(payload)

  return tour;
};



const getAllTours = async (query: Record<string, string>) => {

  const queryBuilder = new QueryBuilder(Tour.find(), query)

  const tours = await queryBuilder
    .search(tourSearchableFields)
    .filter()
    .sort()
    .fields()
    .paginate()


  

  const [data, meta] = await Promise.all([
    tours.build(),
    queryBuilder.getMeta()
  ])

  return {
    data,
    meta
  }
};

const getSingleTour = async (slug: string) => {

  const tour = await Tour.findOne({ slug })

  return {
    data: tour
  }

}


const getSingleTourById = async (id: string) => {
  const tour = await Tour.findById(id)
    .populate("tourType")
    .populate("division");

  return {
    data: tour
  };
};



const updateTour = async (id: string, payload: Partial<ITour & { deleteImages?: string | string[] }>) => {

    const existingTour = await Tour.findById(id);
    if (!existingTour) {
        throw new Error("Tour not found.");
    }

    // Ensure deleteImages is always an array of strings
    const deleteImages: string[] = Array.isArray(payload.deleteImages)
        ? payload.deleteImages.filter(img => typeof img === 'string')
        : typeof payload.deleteImages === 'string'
            ? [payload.deleteImages]
            : [];

    // Remove deleteImages from the payload passed to Mongoose
    const updatePayload = { ...payload };
    delete updatePayload.deleteImages;

    
    if (updatePayload.title) {
        const baseSlug = updatePayload.title.toLowerCase().split(" ").join("-");
        let slug = baseSlug;
        let counter = 0;

        //  Exclude current tour from slug check
        while (await Tour.exists({ slug, _id: { $ne: id } })) {
            slug = `${baseSlug}-${counter++}`;
        }

        updatePayload.slug = slug;
    }

    
    const newUploadedImages = updatePayload.images || [];

    // Get existing images that are NOT marked for deletion
    const restDBImages = (existingTour.images || []).filter(
        (img: string) => !deleteImages.includes(img)
    );

    //  Only update images if new images were uploaded OR images were deleted
    if (newUploadedImages.length > 0 || deleteImages.length > 0) {
        updatePayload.images = [...restDBImages, ...newUploadedImages];
    } else {
        // Keep existing images if no changes
        delete updatePayload.images;
    }

    
    const updatedTour = await Tour.findByIdAndUpdate(id, updatePayload, {
        new: true,
        runValidators: true,
    })
        .populate("tourType")
        .populate("division");

      // Delete images from Cloudinary
    if (deleteImages.length > 0) {
        await Promise.all(
            deleteImages.map((url) => deleteImageFromCLoudinary(url))
        );
    }

    return updatedTour;
};



const deleteTour = async (id: string) => {
  return await Tour.findByIdAndDelete(id);
};





// tour type
const createTourType = async (payload: ITourType) => {
  const existingTourType = await TourType.findOne({ name: payload.name });

  if (existingTourType) {
    throw new Error("Tour type already exists.");
  }

  return await TourType.create({ name: payload.name });
};


const getAllTourTypes = async (query: Record<string, string>) => {

  const queryBuilder = new QueryBuilder(TourType.find(), query);

  const tourTypesData = await queryBuilder
    .search(tourTypesSearchableFields)
    .filter()
    .sort()
    .fields()
    .paginate()


  const [data, meta] = await Promise.all([
    tourTypesData.build(),
    queryBuilder.getMeta()
  ])
  return {
    data, meta
  }
};

const getSingleTourType = async (id: string) => {
  const tourType = await TourType.findById(id);
  return {
    data: tourType
  };
};


const updateTourType = async (id: string, payload: ITourType) => {
  const existingTourType = await TourType.findById(id);
  if (!existingTourType) {
    throw new Error("Tour type not found.");
  }

  const updatedTourType = await TourType.findByIdAndUpdate(id, payload, { new: true });
  return updatedTourType;
};


const deleteTourType = async (id: string) => {
  const existingTourType = await TourType.findById(id);
  if (!existingTourType) {
    throw new Error("Tour type not found.");
  }

  return await TourType.findByIdAndDelete(id);
};


export const TourService = {
  createTour,
  createTourType,
  deleteTourType,
  updateTourType,
  getAllTourTypes,
  getSingleTourType,
  getAllTours,
  getSingleTour,
  updateTour,
  deleteTour,
  getSingleTourById
};