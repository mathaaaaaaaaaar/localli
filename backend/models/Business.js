import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema({
    name: String,
    description: String,
    category: String,
    address: String,
    phone: String,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.model('Business', businessSchema);