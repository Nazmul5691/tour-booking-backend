/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { TourService } from './tour.service';
import { ITour } from './tour.interface';



// tour
// const createTour = catchAsync(async (req: Request, res: Response) => {

//     const payload: ITour = {
//         ...req.body,
//         images: (req.files as Express.Multer.File[]).map(file => file.path)
//     }

//     //  console.log('Incoming request body:', req.body);

//     // const result = await TourService.createTour(req.body);
//     const result = await TourService.createTour(payload);
//     sendResponse(res, {
//         statusCode: 201,
//         success: true,
//         message: 'Tour created successfully',
//         data: result,
//     });
// });

const createTour = catchAsync(async (req: Request, res: Response) => {
    let tourData: any = {};

    // Check if data is sent as JSON string in 'data' field
    if (req.body.data) {
        try {
            tourData = JSON.parse(req.body.data);
        } catch (error) {
            throw new Error("Invalid JSON data");
        }
    } else {
        // Otherwise, parse individual fields (existing logic)
        const parseArrayField = (field: any): string[] => {
            if (!field) return [];
            if (Array.isArray(field)) return field;
            if (typeof field === 'string') {
                try {
                    const parsed = JSON.parse(field);
                    return Array.isArray(parsed) ? parsed : [field];
                } catch {
                    return [field];
                }
            }
            return [];
        };

        const parseNumber = (value: any): number | undefined => {
            if (value === null || value === undefined || value === "") return undefined;
            const num = Number(value);
            return isNaN(num) ? undefined : num;
        };

        tourData = {
            title: req.body.title,
            description: req.body.description,
            location: req.body.location,
            costFrom: parseNumber(req.body.costFrom),
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            included: parseArrayField(req.body.included),
            excluded: parseArrayField(req.body.excluded),
            amenities: parseArrayField(req.body.amenities),
            tourPlan: parseArrayField(req.body.tourPlan),
            maxGuest: parseNumber(req.body.maxGuest),
            minAge: parseNumber(req.body.minAge),
            division: req.body.division,
            tourType: req.body.tourType,
            discountDate: req.body.discountDate,
            discountPercentage: parseNumber(req.body.discountPercentage),
            departureLocation: req.body.departureLocation,
            arrivalLocation: req.body.arrivalLocation,
        };
    }

    // Add images
    const payload: ITour = {
        ...tourData,
        images: (req.files as Express.Multer.File[])?.map(file => file.path) || []
    };

    const result = await TourService.createTour(payload);
    
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Tour created successfully',
        data: result,
    });
});



const getAllTours = catchAsync(async (req: Request, res: Response) => {

    const query = req.query
    const result = await TourService.getAllTours(query as Record<string, string>);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Tours retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
});


const getSingleTour = catchAsync(async (req: Request, res: Response) => {
    const slug = req.params.slug;
    const result = await TourService.getSingleTour(slug);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Tour Retrieved",
        data: result.data
    })
})


const getSingleTourById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await TourService.getSingleTourById(id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Tour Retrieved",
        data: result.data,
    });
});



const updateTour = catchAsync(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;

    //  Only add images if files exist and have length
    const payload: Partial<ITour> = {
        ...req.body,
    };

    //  Only add images to payload if files were actually uploaded
    if (files && files.length > 0) {
        payload.images = files.map(file => file.path);
    }

    const result = await TourService.updateTour(req.params.id, payload);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Tour updated successfully",
        data: result,
    });
});


const deleteTour = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await TourService.deleteTour(id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Tour deleted successfully',
        data: result,
    });
});





// tour type
const createTourType = catchAsync(async (req: Request, res: Response) => {
    const { name } = req.body;
    const result = await TourService.createTourType({ name });
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Tour type created successfully',
        data: result,
    });
});


const getAllTourTypes = catchAsync(async (req: Request, res: Response) => {

    const query = req.query;
    const result = await TourService.getAllTourTypes(query as Record<string, string>);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Tours retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
});


const getSingleTourType = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await TourService.getSingleTourType(id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Tour type retrieved successfully',
        data: result,
    });
});




const updateTourType = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;
    const result = await TourService.updateTourType(id, name);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Tour type updated successfully',
        data: result,
    });
});


const deleteTourType = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await TourService.deleteTourType(id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Tour type deleted successfully',
        data: result,
    });
});

export const TourController = {
    createTour,
    createTourType,
    getAllTourTypes,
    getSingleTourType,
    deleteTourType,
    updateTourType,
    getAllTours,
    getSingleTour,
    updateTour,
    deleteTour,
    getSingleTourById
};