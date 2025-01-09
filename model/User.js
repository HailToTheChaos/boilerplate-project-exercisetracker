import mongoose from "mongoose"

const userSchema = mongoose.Schema({
    _id: { type: String, require: true },
    username: { type: String, require: true, unique: true }
})

export default mongoose.model("User", userSchema)