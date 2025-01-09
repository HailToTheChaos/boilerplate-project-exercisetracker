import mongoose from "mongoose"

const exerciseSchema = mongoose.Schema({
    _id: { type: String, require: true },
    username: { type: String, require: true },
    description: { type: String, require: true },
    duration: { type: Number, require: true },
    date: { type: Date, default: Date.now }
});

export default mongoose.model("Exercise", exerciseSchema)