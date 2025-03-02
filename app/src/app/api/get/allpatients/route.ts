import connectDB from "@/lib/connectDB";
import PatientModel from "@/Models/Patient";

import { NextResponse } from "next/server";

export async function GET(){

    connectDB();

    try {
        const patient = await PatientModel.find({});
    
        if(!patient){
            return NextResponse.json( {
                status: 400,
                body: {
                    message: 'Patient not found'
                }
            }
        )}

      
    
        return NextResponse.json( {
            status: 200,
            body: {
                message: 'Got Info',               
                data: patient
            }
        })
    } catch (error) {
        return NextResponse.json({
            status: 500,
            body: {
                message: error.message
            }
        })
        
    }
}