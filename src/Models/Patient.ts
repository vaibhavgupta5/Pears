import mongoose, { Schema, Types, Document } from 'mongoose';

interface IPatient extends Document {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contact: {
    phone: string;
    email: string;
  };
  address?: string;
  emergency_contact?: {
    name?: string;
    relation?: string;
    phone?: string;
  };
  room_number: string;
  assigned_doctor?: Types.ObjectId;
  assigned_nurse?: Types.ObjectId;
  health_metrics?: {
    heart_rate?: number;
    blood_pressure?: {
      systolic?: number;
      diastolic?: number;
    };
    oxygen_saturation?: number;
    respiratory_rate?: number;
    temperature?: number;
    updated_at?: Date;
  };
  createdAt?: Date;
}

const PatientSchema = new Schema<IPatient>({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
  },
  address: { type: String },
  emergency_contact: {
    name: { type: String },
    relation: { type: String },
    phone: { type: String },
  },
  room_number: { type: String, required: true },
  assigned_doctor: { type: Schema.Types.ObjectId, ref: 'Doctor' },
  assigned_nurse: { type: Schema.Types.ObjectId, ref: 'Nurse' },
  health_metrics: {
    heart_rate: { type: Number },
    blood_pressure: { 
      systolic: { type: Number }, 
      diastolic: { type: Number } 
    },
    oxygen_saturation: { type: Number },
    respiratory_rate: { type: Number },
    temperature: { type: Number },
    updated_at: { type: Date, default: Date.now },
  },
  createdAt: { type: Date, default: Date.now },
});

const PatientModel =
  mongoose.models && mongoose.models.Patient
    ? (mongoose.models.User as mongoose.Model<IPatient>)
    : mongoose.model<IPatient>("Patient", PatientSchema);

export default PatientModel;
