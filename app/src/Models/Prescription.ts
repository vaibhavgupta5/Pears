import mongoose, { Document, Schema, model } from "mongoose";

// Define interfaces for better TypeScript support
interface IMedicine {
  name: string;
  dosage: string; // e.g., "1 tablet twice a day"
  duration: string; // e.g., "5 days"
}

interface IPrescription extends Document {
  patient_id: mongoose.Types.ObjectId;
  doctor_id: mongoose.Types.ObjectId;
  medicines: IMedicine[];
  notes?: string;
  uploaded_prescription?: string; // URL of uploaded prescription file (optional)
  created_at: Date;
}

// Define the schema
const PrescriptionSchema = new Schema<IPrescription>(
  {
    patient_id: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctor_id: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    medicines: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        duration: { type: String, required: true },
      },
    ],
    notes: {
      type: String,
      default: "",
    },
    uploaded_prescription: {
      type: String, // URL for the uploaded file
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Export the model
const PrescriptionModel = model<IPrescription>("Prescription", PrescriptionSchema);

export default PrescriptionModel;
