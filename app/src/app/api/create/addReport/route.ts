import connectDB from "@/lib/connectDB";
import PatientModel from "@/Models/Patient";
import ReportModel from "@/Models/Report";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

// Define Zod Schema for Validation
const addReportSchema = z.object({
  patient_id: z.string().nonempty("Patient ID is required"),
  nurse_id: z.string().optional(),
  report_date: z.string().nonempty("Report date is required"),
  medications_administered: z.array(z.string()).optional(),
  message: z.string().optional(),
  file_url: z.string().url("Invalid file URL"),
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const rawData = await req.text();
    const data = addReportSchema.parse(JSON.parse(rawData));

    connectDB();

    // Prepare data for saving
    const newReportData = {
      patient_id: new mongoose.Types.ObjectId(data.patient_id),
      nurse_id: data.nurse_id ? new mongoose.Types.ObjectId(data.nurse_id) : null,
      report_date: new Date(data.report_date),
      medications_administered: data.medications_administered || [],
      message: data.message || "",
      files: [
        {
          file_url: data.file_url,
          upload_date: new Date(),
        },
      ],
      createdAt: new Date(),
    };

    // Save the report in the database
    const newReport = new ReportModel(newReportData);
    await newReport.save();

    // Link the report to the patient
    const patient = await PatientModel.findById(data.patient_id);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    patient.reports.push(newReport._id as any);
    await patient.save();

    return NextResponse.json({
      status: 200,
      body: {
        message: "Report added successfully",
        report: newReport,
      },
    });
  } catch (error: any) {
    console.error("Error adding report:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to add report" },
      { status: 500 }
    );
  }
}
