/* eslint-env node */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// ✅ Connect to MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.log("❌ Missing MONGO_URI in .env");
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
console.log("✅ Connected to MongoDB Atlas");

const doctors = [
     {
    firstName: "Sibongile",
    lastName: "Mahlangu",
    email: "sibongile.mahlangu@doctor.com",
    phone: "0724419001",
    specialty: "General Practitioner",
    registrationNumber: "HPCSA-GP-10211",
    yearsOfExperience: 8,
    clinicName: "Mbombela Family Health Clinic",
    province: "Mpumalanga",
    city: "Nelspruit",
    password: "Password123",
    role: "doctor",
    status: "approved"
  },
  {
    firstName: "Jonathan",
    lastName: "Visser",
    email: "jonathan.visser@doctor.com",
    phone: "0831127709",
    specialty: "Dentist",
    registrationNumber: "HPCSA-DENT-66712",
    yearsOfExperience: 6,
    clinicName: "Sandton Smile Dental",
    province: "Gauteng",
    city: "Sandton",
    password: "Password123",
    role: "doctor",
    status: "approved"
  },
 {
    "firstName": "Ayanda",
    "lastName": "Gumede",
    "email": "ayanda.gumede@doctor.com",
    "phone": "0812208811",
    "specialty": "Psychiatrist",
    "registrationNumber": "HPCSA-PSY-44092",
    "yearsOfExperience": 14,
    "clinicName": "KZN Mental Wellness Centre",
    "province": "KwaZulu-Natal",
    "city": "Durban",
    "password": "Password123"
  },
  {
    "firstName": "Marcel",
    "lastName": "De Klerk",
    "email": "marcel.deklerk@doctor.com",
    "phone": "0748821134",
    "specialty": "Orthopedic Surgeon",
    "registrationNumber": "HPCSA-ORT-77801",
    "yearsOfExperience": 17,
    "clinicName": "Pretoria Orthopedic Hospital",
    "province": "Gauteng",
    "city": "Pretoria",
    "password": "Password123"
  },
  {
    "firstName": "Nandi",
    "lastName": "Cele",
    "email": "nandi.cele@doctor.com",
    "phone": "0796652001",
    "specialty": "Gynecologist",
    "registrationNumber": "HPCSA-GYN-31990",
    "yearsOfExperience": 9,
    "clinicName": "Women’s Wellness Centre",
    "province": "Free State",
    "city": "Bloemfontein",
    "password": "Password123"
  },
  {
    "firstName": "Michael",
    "lastName": "Steyn",
    "email": "michael.steyn@doctor.com",
    "phone": "0617723300",
    "specialty": "Pediatrician",
    "registrationNumber": "HPCSA-PED-99101",
    "yearsOfExperience": 11,
    "clinicName": "Kimberley Children’s Hospital",
    "province": "Northern Cape",
    "city": "Kimberley",
    "password": "Password123"
  },
  {
    "firstName": "Karabo",
    "lastName": "Mabaso",
    "email": "karabo.mabaso@doctor.com",
    "phone": "0827713319",
    "specialty": "Neurologist",
    "registrationNumber": "HPCSA-NEU-88210",
    "yearsOfExperience": 13,
    "clinicName": "KZN Neuro & Spine Centre",
    "province": "KwaZulu-Natal",
    "city": "Pietermaritzburg",
    "password": "Password123"
  },
  {
    "firstName": "Tyrone",
    "lastName": "Daniels",
    "email": "tyrone.daniels@doctor.com",
    "phone": "0734101122",
    "specialty": "Dermatologist",
    "registrationNumber": "HPCSA-DERM-31122",
    "yearsOfExperience": 7,
    "clinicName": "SkinCare Cape Dermatology",
    "province": "Western Cape",
    "city": "Cape Town",
    "password": "Password123"
  },
  {
    "firstName": "Precious",
    "lastName": "Makwena",
    "email": "precious.makwena@doctor.com",
    "phone": "0789011200",
    "specialty": "Cardiologist",
    "registrationNumber": "HPCSA-CARD-78220",
    "yearsOfExperience": 16,
    "clinicName": "Polokwane Heart Institute",
    "province": "Limpopo",
    "city": "Polokwane",
    "password": "Password123"
  },
  {
    "firstName": "Wendy",
    "lastName": "Masinga",
    "email": "wendy.masinga@doctor.com",
    "phone": "0624439100",
    "specialty": "General Practitioner",
    "registrationNumber": "HPCSA-GP-55509",
    "yearsOfExperience": 6,
    "clinicName": "Mamelodi Community Clinic",
    "province": "Gauteng",
    "city": "Pretoria",
    "password": "Password123"
  },
  {
    "firstName": "Samuel",
    "lastName": "Nkosi",
    "email": "samuel.nkosi@doctor.com",
    "phone": "0841192255",
    "specialty": "ENT Specialist",
    "registrationNumber": "HPCSA-ENT-80119",
    "yearsOfExperience": 12,
    "clinicName": "Johannesburg ENT Centre",
    "province": "Gauteng",
    "city": "Johannesburg",
    "password": "Password123"
  },
  {
    "firstName": "Thandeka",
    "lastName": "Mabuza",
    "email": "thandeka.mabuza@doctor.com",
    "phone": "0713328822",
    "specialty": "Ophthalmologist",
    "registrationNumber": "HPCSA-EYE-21901",
    "yearsOfExperience": 10,
    "clinicName": "Mpumalanga Vision Clinic",
    "province": "Mpumalanga",
    "city": "Nelspruit",
    "password": "Password123"
  },
  {
    "firstName": "Vuyo",
    "lastName": "Dlamini",
    "email": "vuyo.dlamini@doctor.com",
    "phone": "0739912012",
    "specialty": "General Surgeon",
    "registrationNumber": "HPCSA-SURG-51230",
    "yearsOfExperience": 15,
    "clinicName": "Bloemfontein Surgical Institute",
    "province": "Free State",
    "city": "Bloemfontein",
    "password": "Password123"
  },
  {
    "firstName": "Amelia",
    "lastName": "Jacobs",
    "email": "amelia.jacobs@doctor.com",
    "phone": "0823310099",
    "specialty": "Dermatologist",
    "registrationNumber": "HPCSA-DERM-10022",
    "yearsOfExperience": 5,
    "clinicName": "Cape Skin Care Centre",
    "province": "Western Cape",
    "city": "Cape Town",
    "password": "Password123"
  },
  {
    "firstName": "Mandla",
    "lastName": "Sithole",
    "email": "mandla.sithole@doctor.com",
    "phone": "0746652300",
    "specialty": "Physician",
    "registrationNumber": "HPCSA-PHY-11922",
    "yearsOfExperience": 19,
    "clinicName": "Johannesburg Health Hospital",
    "province": "Gauteng",
    "city": "Johannesburg",
    "password": "Password123"
  },
  {
    "firstName": "Dineo",
    "lastName": "Radebe",
    "email": "dineo.radebe@doctor.com",
    "phone": "0781109002",
    "specialty": "Pediatrician",
    "registrationNumber": "HPCSA-PED-41201",
    "yearsOfExperience": 8,
    "clinicName": "Durban Child Health Clinic",
    "province": "KwaZulu-Natal",
    "city": "Durban",
    "password": "Password123"
  },
  {
    "firstName": "Pieter",
    "lastName": "van Wyk",
    "email": "pieter.vanwyk@doctor.com",
    "phone": "0825500021",
    "specialty": "Urologist",
    "registrationNumber": "HPCSA-URO-21520",
    "yearsOfExperience": 14,
    "clinicName": "Cape Urology Centre",
    "province": "Western Cape",
    "city": "Cape Town",
    "password": "Password123"
  },
  {
    "firstName": "Nomvula",
    "lastName": "Mthembu",
    "email": "nomvula.mthembu@doctor.com",
    "phone": "0724432211",
    "specialty": "Endocrinologist",
    "registrationNumber": "HPCSA-ENDO-11245",
    "yearsOfExperience": 11,
    "clinicName": "Soweto Diabetes & Hormone Clinic",
    "province": "Gauteng",
    "city": "Soweto",
    "password": "Password123"
  },
  {
    "firstName": "Andre",
    "lastName": "Botha",
    "email": "andre.botha@doctor.com",
    "phone": "0831127734",
    "specialty": "Cardiologist",
    "registrationNumber": "HPCSA-CARD-22211",
    "yearsOfExperience": 20,
    "clinicName": "Johannesburg Cardiology Clinic",
    "province": "Gauteng",
    "city": "Johannesburg",
    "password": "Password123"
  },
  {
    "firstName": "Keitumetse",
    "lastName": "Phiri",
    "email": "keitumetse.phiri@doctor.com",
    "phone": "0713128822",
    "specialty": "General Practitioner",
    "registrationNumber": "HPCSA-GP-99301",
    "yearsOfExperience": 4,
    "clinicName": "Mahikeng Community Clinic",
    "province": "North West",
    "city": "Mahikeng",
    "password": "Password123"
  }
];

async function seedDoctors() {
  try {
    console.log("🗑️ Removing existing doctors...");
    await User.deleteMany({ role: "doctor" });

    for (const doc of doctors) {
      const hashedPassword = await bcrypt.hash("Password123", 10); // ✅ Apply hashed password

      await User.create({
        ...doc,
        email: doc.email.toLowerCase().trim(),
        password: hashedPassword,
        role: "doctor",
        status: "approved", // ✅ ensures doctor is visible & can log in
      });

      console.log(`✅ Added: Dr. ${doc.firstName} ${doc.lastName}`);
    }

    console.log("🎉 All doctors seeded successfully!");
  } catch (err) {
    console.log("❌ Error seeding doctors:", err.message);
  } finally {
    mongoose.connection.close();
    console.log("🔌 Connection closed");
  }
}

seedDoctors();