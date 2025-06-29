import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import {auth} from "@clerk/nextjs/server";
export async function POST(req: Request) {
  try {
    const { userId } =await  auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.log("VERIFY_PAYMENT_REQUEST");
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } = await req.json();
   console.log("Received Data:", {
      razorpay_signature,
    });
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courseId) {
      return new NextResponse("Missing Parameters", { status: 400 });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
     console.log("Generated Signature:", generatedSignature);
    if (generatedSignature !== razorpay_signature) {
      return new NextResponse("Invalid signature", { status: 400 });
    }

    // Mark purchase in your DB
    // You can fetch userId based on session or Razorpay notes in real-world apps
    const purchaseExists = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: userId, 
          courseId: courseId,
        },
      },
    });

    if (purchaseExists) {
      return new NextResponse("Already Purchased", { status: 200 });
    }

    await db.purchase.create({
      data: {
        courseId: courseId,
        userId: userId,
      },
    });
      console.log("Purchase created for user:", userId, "and course:", courseId);
    
    return new NextResponse("Payment Verified", { status: 200 });
  } catch (error) {
    console.error("VERIFY_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

