const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
    {
        offCode: {
            type: String,
            required: true,
            unique: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        brand: {
            type: String,
            default: "",
            trim: true
        },

        ingredientsText: {
            type: String,
            default: ""
        },

        novaGroup: {
            type: Number,
            required: true,
            min: 1,
            max: 4
        },

        imageUrl: {
            type: String,
            default: ""
        },

        source: {
            type: String,
            default: "Open Food Facts"
        },

        approved: {
            type: Boolean,
            default: false
        },

        approvalNote: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Food", foodSchema);