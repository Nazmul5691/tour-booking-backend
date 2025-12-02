/* eslint-disable @typescript-eslint/no-dynamic-delete */

import { Query } from "mongoose";
import { excludeField } from "../constants"; // Assuming excludeField is where 'page', 'limit', 'sort', etc. are stored

export class QueryBuilder<T> {
    public modelQuery: Query<T[], T>;
    public readonly query: Record<string, string>

    constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
        this.modelQuery = modelQuery;
        this.query = query;
    }


    filter(): this {
        const filter = { ...this.query }

        for (const field of excludeField) {
            delete filter[field]
        }
        
        // This applies the non-pagination filters (like division, tourType)
        this.modelQuery = this.modelQuery.find(filter) 

        return this;
    }

    search(searchableField: string[]): this {
        const searchTerm = this.query.searchTerm || ""
        const searchQuery = {
            $or: searchableField.map(field => ({ [field]: { $regex: searchTerm, $options: "i" } }))
        }

        // This applies the search filter
        this.modelQuery = this.modelQuery.find(searchQuery)
        return this
    }


    sort(): this {
        const sort = this.query.sort || "-createdAt";
        this.modelQuery = this.modelQuery.sort(sort)
        return this;
    }


    fields(): this {
        const fields = this.query.fields?.split(",").join(" ") || ""
        this.modelQuery = this.modelQuery.select(fields)
        return this;
    }


    paginate(): this {
        const page = Number(this.query.page) || 1
        const limit = Number(this.query.limit) || 10
        const skip = (page - 1) * limit

        // This applies the limit/skip for fetching the data for the current page
        this.modelQuery = this.modelQuery.skip(skip).limit(limit)

        return this;
    }


    build() {
        return this.modelQuery
    }


    /**
     * Retrieves the total count and pagination metadata.
     * * IMPORTANT FIX: We must use the filters applied to the current query
     * to accurately count the total documents, not just the base model count.
     */
    async getMeta() {
        // 1. Get the current applied filters (from filter() and search() steps)
        const currentFilters = this.modelQuery.getFilter();
        
        // 2. Count the total documents that match those filters
        const totalDocuments = await this.modelQuery.model.countDocuments(currentFilters);

        const page = Number(this.query.page) || 1
        const limit = Number(this.query.limit) || 10

        const totalPage = Math.ceil(totalDocuments / limit)

        return {
            page,
            limit,
            total: totalDocuments, 
            totalPage
        }
    }
}










// import { Query } from "mongoose";
// import { excludeField } from "../constants";

// export class QueryBuilder<T> {
//     public modelQuery: Query<T[], T>;
//     public readonly query: Record<string, string>

//     constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
//         this.modelQuery = modelQuery;
//         this.query = query;
//     }


//     filter(): this {
//         const filter = { ...this.query }

//         for (const field of excludeField) {
//             // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
//             delete filter[field]
//         }

//         this.modelQuery = this.modelQuery.find(filter) // Tour.find().find(filter)

//         return this;
//     }

//     search(searchableField: string[]): this {
//         const searchTerm = this.query.searchTerm || ""
//         const searchQuery = {
//             $or: searchableField.map(field => ({ [field]: { $regex: searchTerm, $options: "i" } }))
//         }

//         this.modelQuery = this.modelQuery.find(searchQuery)
//         return this
//     }


//     sort(): this {

//         const sort = this.query.sort || "-createdAt";

//         this.modelQuery = this.modelQuery.sort(sort)

//         return this;
//     }


//     fields(): this {

//         const fields = this.query.fields?.split(",").join(" ") || ""

//         this.modelQuery = this.modelQuery.select(fields)

//         return this;
//     }



//     paginate(): this {

//         const page = Number(this.query.page) || 1
//         const limit = Number(this.query.limit) || 10
//         const skip = (page - 1) * limit

//         this.modelQuery = this.modelQuery.skip(skip).limit(limit)

//         return this;
//     }



//     build() {
//         return this.modelQuery
//     }



//     async getMeta() {
//         const totalDocuments = await this.modelQuery.model.countDocuments()

//         const page = Number(this.query.page) || 1
//         const limit = Number(this.query.limit) || 10

//         const totalPage = Math.ceil(totalDocuments / limit)

//         return {
//             page,
//             limit,
//             total: totalDocuments,
//             totalPage
//         }
//     }
// }



