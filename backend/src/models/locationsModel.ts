import { Schema } from 'mongoose';

const locationSchema = new Schema({
    coordinates: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 }
    },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    province: { type: String, default: "" },
    country: { type: String, default: "Sri Lanka" }
}, { _id: false });

export default locationSchema;